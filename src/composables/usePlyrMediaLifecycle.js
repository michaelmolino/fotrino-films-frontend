import { nextTick, onBeforeUnmount, ref, watch, computed, toRef } from 'vue'
import { useQuery } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { setupVideoPlayback } from '@utils/video-playback'

function createPlyrPlaybackController({ mediaEl }) {
  const player = ref(null)
  const teardownPlayback = ref(null)
  const playbackSession = ref(null)
  let PlyrCtor = null

  function destroyPlayers() {
    if (teardownPlayback.value) {
      teardownPlayback.value()
      teardownPlayback.value = null
    }

    if (player.value) {
      player.value.destroy()
      player.value = null
    }

    playbackSession.value = null
  }

  async function setupPlayerForMedia({ mediaSnapshot, sourceUrl }) {
    const el = mediaEl.value
    if (!el) {
      throw new Error('Plyr media element is missing during player setup.')
    }

    const isVideo = !mediaSnapshot.type.startsWith('audio/')
    const isPortrait = isVideo && mediaSnapshot.orientation === 'portrait'
    const controls = isPortrait
      ? ['play-large', 'play', 'progress', 'mute', 'fullscreen', 'airplay']
      : [
          'play-large',
          'restart',
          'rewind',
          'play',
          'fast-forward',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'fullscreen',
          'airplay'
        ]

    if (!PlyrCtor) {
      const mod = await import('plyr')
      PlyrCtor = mod.default
    }

    player.value = new PlyrCtor(el, {
      iconUrl: `${import.meta.env.BASE_URL}icons/plyr.svg`,
      loadSprite: true,
      blankVideo: `${import.meta.env.BASE_URL}media/blank.mp4`,
      settings: [],
      fullscreen: { iosNative: true },
      keyboard: { focused: true, global: true },
      controls
    })

    if (isVideo) {
      let hasAutoFullscreened = false
      player.value.on('play', () => {
        if (!hasAutoFullscreened) {
          hasAutoFullscreened = true
          player.value.fullscreen.enter()
        }
      })
    }

    if (isVideo) {
      const session = await setupVideoPlayback({
        videoEl: el,
        sourceUrl,
        exposeHlsGlobally: import.meta.env.DEV
      })
      teardownPlayback.value = session.cleanup
      playbackSession.value = session
    } else {
      el.src = sourceUrl
    }
  }

  async function refreshPlaybackSource(sourceUrl) {
    if (!playbackSession.value?.refreshSource) {
      throw new Error('Playback session is not initialized.')
    }

    playbackSession.value.refreshSource(sourceUrl)
  }

  return {
    destroyPlayers,
    setupPlayerForMedia,
    refreshPlaybackSource
  }
}

export function usePlyrMediaLifecycle(props, mediaEl, options = {}) {
  const media = toRef(props, 'media')
  let lifecycleRunId = 0
  const { destroyPlayers, setupPlayerForMedia, refreshPlaybackSource } =
    createPlyrPlaybackController({ mediaEl })
  const { onPlaybackReady = null } = options

  const mediaSessionQuery = useQuery(() => {
    const privateId = media.value.privateId

    return {
      key: ['channel', 'media-session', privateId],
      enabled: false,
      staleTime: 0,
      query: async () => {
        const { data } = await api.post(`/channels/media/session/${privateId}`, null, {
          __policy: {
            csrfHandling: 'none'
          }
        })
        return data?.data ?? null
      }
    }
  })

  async function resolvePlaybackUrl(mediaSnapshot) {
    if (!mediaSnapshot.privateId) {
      throw new Error('Media is missing privateId; cannot create playback session.')
    }

    // Token auto-refresh is intentionally disabled for now.
    // If the session expires, users must reload to obtain a new playback URL.
    await mediaSessionQuery.refresh()
    const session = mediaSessionQuery.data.value
    if (!session?.playbackUrl) {
      throw new Error('Playback session response missing playbackUrl.')
    }

    return session.playbackUrl
  }

  async function syncPlaybackLifecycle({ rebuild = false } = {}) {
    const mediaSnapshot = { ...media.value }
    const runId = ++lifecycleRunId

    const sourceUrl = await resolvePlaybackUrl(mediaSnapshot)

    if (runId !== lifecycleRunId) return

    if (rebuild) {
      destroyPlayers()
      await nextTick()
      if (runId !== lifecycleRunId) return

      await setupPlayerForMedia({ mediaSnapshot, sourceUrl })
      if (runId !== lifecycleRunId) {
        destroyPlayers()
        return
      }

      onPlaybackReady?.()
      return
    }

    if (mediaSnapshot.privateId && mediaSessionQuery.data.value) {
      await refreshPlaybackSource(sourceUrl)
      if (runId !== lifecycleRunId) return

      onPlaybackReady?.()
      return
    }

    destroyPlayers()
    await nextTick()
    if (runId !== lifecycleRunId) return

    await setupPlayerForMedia({ mediaSnapshot, sourceUrl })
    if (runId !== lifecycleRunId) {
      destroyPlayers()
      return
    }

    onPlaybackReady?.()
  }

  const playbackLifecycleKey = computed(
    () => `${media.value.privateId}|${media.value.type}|${media.value.orientation}`
  )

  watch(
    playbackLifecycleKey,
    async () => {
      await syncPlaybackLifecycle({ rebuild: true })
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    lifecycleRunId += 1
    destroyPlayers()
  })

  return {
    syncPlaybackLifecycle,
    destroyPlayers
  }
}
