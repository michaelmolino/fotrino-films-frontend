import Hls from 'hls.js'

function parseJwtExpMs(token) {
    try {
        const payload = token.split('.')[1]
        if (!payload) return null
        const base64 = payload.replaceAll('-', '+').replaceAll('_', '/')
        const paddedBase64 = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
        const decodedPayload = globalThis.atob(paddedBase64)
        const parsedPayload = JSON.parse(decodedPayload)
        return typeof parsedPayload?.exp === 'number' ? parsedPayload.exp * 1000 : null
    } catch {
        return null
    }
}

function withToken(url, token) {
    if (!token) return url
    const [base, query] = url.split('?')
    const params = new URLSearchParams(query)
    params.delete('token')
    params.set('token', token)
    return `${base}?${params.toString()}`
}

function supportsNativeHls(videoEl) {
    const support = videoEl.canPlayType('application/vnd.apple.mpegurl')
    if (support !== 'probably' && support !== 'maybe') return false

    // Favor native when AirPlay APIs exist; otherwise use hls.js.
    const hasAirPlayApi = typeof videoEl.webkitShowPlaybackTargetPicker === 'function' ||
        'WebKitPlaybackTargetAvailabilityEvent' in globalThis

    return hasAirPlayApi
}

function createTokenManager(fetchToken) {
    const state = {
        value: null,
        exp: 0
    }

    async function refresh() {
        const token = await fetchToken()
        if (!token) return
        state.value = token
        state.exp = parseJwtExpMs(token) ?? 0
    }

    function isExpired() {
        if (!state.value || !state.exp) return true
        // Consider token expired if less than 30s left
        return Date.now() >= state.exp - 30000
    }

    function buildUrl(url) {
        return withToken(url, state.value)
    }

    return {
        refresh,
        isExpired,
        buildUrl
    }
}

async function setupHlsJsPlayback({ videoEl, sourceUrl, tokenManager, exposeHlsGlobally }) {
    if (!Hls.isSupported()) {
        console.error('HLS is not supported in this browser.')
        return {
            hlsInstance: null,
            cleanup: () => { }
        }
    }

    const hlsInstance = new Hls({
        capLevelToPlayerSize: false,
        xhrSetup: (xhr, url) => {
            xhr.open('GET', tokenManager.buildUrl(url), true)
        }
    })

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (Array.isArray(data?.levels) && data.levels.length > 0) {
            // Prefer highest at startup; ABR can still adapt if needed.
            const highestLevel = data.levels.length - 1
            hlsInstance.startLevel = highestLevel
            hlsInstance.nextLevel = highestLevel
        }
    })

    const onHlsError = (_, data) => {
        if (!data?.fatal) return

        switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                hlsInstance.startLoad()
                break
            case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance.recoverMediaError()
                break
            default:
                hlsInstance.destroy()
                break
        }
    }

    hlsInstance.on(Hls.Events.ERROR, onHlsError)

    hlsInstance.loadSource(tokenManager.buildUrl(sourceUrl))
    hlsInstance.attachMedia(videoEl)
    if (exposeHlsGlobally) {
        globalThis.hls = hlsInstance
    }

    return {
        hlsInstance,
        cleanup: () => {
            hlsInstance.off(Hls.Events.ERROR, onHlsError)
            hlsInstance.destroy()
            if (exposeHlsGlobally && globalThis.hls === hlsInstance) {
                delete globalThis.hls
            }
        }
    }
}

async function setupNativeHlsPlayback({ videoEl, sourceUrl, tokenManager }) {
    videoEl.src = tokenManager.buildUrl(sourceUrl)
    videoEl.load()

    return {
        hlsInstance: null,
        cleanup: () => { }
    }
}

export async function setupTokenizedVideoPlayback({
    videoEl,
    sourceUrl,
    fetchToken,
    exposeHlsGlobally = false
}) {
    if (!videoEl || !sourceUrl || typeof fetchToken !== 'function') {
        return {
            hlsInstance: null,
            cleanup: () => { }
        }
    }
    const tokenManager = createTokenManager(fetchToken)
    await tokenManager.refresh()

    if (supportsNativeHls(videoEl)) {
        return setupNativeHlsPlayback({ videoEl, sourceUrl, tokenManager })
    }

    return setupHlsJsPlayback({ videoEl, sourceUrl, tokenManager, exposeHlsGlobally })
}
