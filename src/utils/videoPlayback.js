import Hls from 'hls.js'

const NATIVE_HLS_MIME_TYPES = ['application/vnd.apple.mpegurl', 'application/x-mpegURL']

function supportsNativeHls(videoEl) {
    return NATIVE_HLS_MIME_TYPES.some((mimeType) => videoEl.canPlayType(mimeType))
}

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

function createTokenManager(fetchToken) {
    const state = {
        value: null,
        issuedAt: 0,
        exp: 0
    }

    async function refresh() {
        const token = await fetchToken()
        if (!token) return

        state.value = token
        state.issuedAt = Date.now()
        state.exp = parseJwtExpMs(token) ?? 0
    }

    function isStale() {
        if (!state.value || !state.exp) return true

        const halfLife = (state.exp - state.issuedAt) / 2
        return Date.now() >= state.issuedAt + halfLife
    }

    function buildUrl(url) {
        return withToken(url, state.value)
    }

    return {
        refresh,
        isStale,
        buildUrl
    }
}

async function setupNativeHlsPlayback({ videoEl, sourceUrl, tokenManager }) {
    videoEl.src = tokenManager.buildUrl(sourceUrl)
    videoEl.load()

    const onPlayGuard = async () => {
        if (!tokenManager.isStale()) return

        videoEl.pause()
        const resumeAt = videoEl.currentTime

        await tokenManager.refresh()

        videoEl.src = tokenManager.buildUrl(sourceUrl)
        videoEl.load()
        await new Promise((resolve) => videoEl.addEventListener('loadedmetadata', resolve, { once: true }))

        videoEl.currentTime = resumeAt
        videoEl.play().catch(() => { })
    }

    videoEl.addEventListener('play', onPlayGuard)

    return {
        hlsInstance: null,
        cleanup: () => {
            videoEl.removeEventListener('play', onPlayGuard)
        }
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
        abrEwmaDefaultEstimate: 3000000,
        xhrSetup: (xhr, url) => {
            xhr.open('GET', tokenManager.buildUrl(url), true)
        }
    })

    hlsInstance.loadSource(tokenManager.buildUrl(sourceUrl))
    hlsInstance.attachMedia(videoEl)

    if (exposeHlsGlobally) {
        globalThis.hls = hlsInstance
    }

    const onPlayGuard = async () => {
        if (!tokenManager.isStale()) return
        await tokenManager.refresh()
    }

    videoEl.addEventListener('play', onPlayGuard)

    return {
        hlsInstance,
        cleanup: () => {
            videoEl.removeEventListener('play', onPlayGuard)
            try {
                hlsInstance.destroy()
            } catch (e) {
                console.debug(e)
            }

            if (exposeHlsGlobally && globalThis.hls === hlsInstance) {
                delete globalThis.hls
            }
        }
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
