import { Platform } from 'quasar'

let HlsCtor = null

async function getHlsCtor() {
  if (!HlsCtor) {
    const mod = await import('hls.js/dist/hls.light.mjs')
    HlsCtor = mod.default
  }

  return HlsCtor
}

function supportsNativeHls(videoEl) {
  const support = videoEl.canPlayType('application/vnd.apple.mpegurl')
  const supportsNativeMime = support === 'probably' || support === 'maybe'
  if (!supportsNativeMime) return false

  const hasAirPlayApi =
    typeof videoEl.webkitShowPlaybackTargetPicker === 'function' ||
    'WebKitPlaybackTargetAvailabilityEvent' in globalThis
  const isIosFamily = Platform.is.ios || Platform.is.ipad || Platform.is.iphone || Platform.is.ipod

  // Use native playback when Apple platform integration is likely available (AirPlay/system media).
  return isIosFamily || hasAirPlayApi
}

function preservePlaybackState(videoEl, applySource) {
  const wasPlaying = !videoEl.paused
  const resumeTime = Number.isFinite(videoEl.currentTime) ? videoEl.currentTime : 0

  const restorePlaybackState = () => {
    if (resumeTime > 0) {
      try {
        videoEl.currentTime = resumeTime
      } catch {
        // Some browsers reject seeks until metadata is fully ready.
      }
    }

    if (wasPlaying) {
      videoEl.play().catch(() => {})
    }
  }

  videoEl.addEventListener('loadedmetadata', restorePlaybackState, { once: true })
  applySource()
}

async function setupHlsJsPlayback({ videoEl, sourceUrl, exposeHlsGlobally }) {
  const Hls = await getHlsCtor()

  if (!Hls.isSupported()) {
    console.error('HLS is not supported in this browser.')
    return { hlsInstance: null, cleanup: () => {} }
  }

  const hlsInstance = new Hls({
    capLevelToPlayerSize: false,
    xhrSetup: xhr => {
      xhr.withCredentials = true
    }
  })

  hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    if (Array.isArray(data?.levels) && data.levels.length > 0) {
      const highestLevel = data.levels.reduce((bestIndex, level, index, levels) => {
        if (bestIndex < 0) return index

        const bestLevel = levels[bestIndex] || {}
        const currentScore = Number(level?.bitrate || 0)
        const bestScore = Number(bestLevel?.bitrate || 0)

        return currentScore > bestScore ? index : bestIndex
      }, -1)

      // Bias startup toward the highest-bitrate rendition while keeping ABR in auto mode.
      hlsInstance.firstLevel = highestLevel
      hlsInstance.startLevel = highestLevel
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
  hlsInstance.attachMedia(videoEl)

  const refreshSource = nextSourceUrl => {
    preservePlaybackState(videoEl, () => {
      hlsInstance.loadSource(nextSourceUrl)
    })
  }

  refreshSource(sourceUrl)

  if (exposeHlsGlobally) {
    globalThis.hls = hlsInstance
  }

  return {
    hlsInstance,
    refreshSource,
    cleanup: () => {
      hlsInstance.off(Hls.Events.ERROR, onHlsError)
      hlsInstance.destroy()
      if (exposeHlsGlobally && globalThis.hls === hlsInstance) {
        delete globalThis.hls
      }
    }
  }
}

function setupNativeHlsPlayback({ videoEl, sourceUrl }) {
  const refreshSource = nextSourceUrl => {
    preservePlaybackState(videoEl, () => {
      videoEl.src = nextSourceUrl
      videoEl.load()
    })
  }

  refreshSource(sourceUrl)

  return {
    hlsInstance: null,
    refreshSource,
    cleanup: () => {}
  }
}

export async function setupVideoPlayback({ videoEl, sourceUrl, exposeHlsGlobally = false }) {
  if (!videoEl || !sourceUrl) {
    return { hlsInstance: null, cleanup: () => {} }
  }

  if (supportsNativeHls(videoEl)) {
    return setupNativeHlsPlayback({ videoEl, sourceUrl })
  }

  return setupHlsJsPlayback({
    videoEl,
    sourceUrl,
    exposeHlsGlobally
  })
}
