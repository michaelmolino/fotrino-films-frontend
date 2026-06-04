import { nextTick, onBeforeUnmount, ref, watch, computed, toRef } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import { setupVideoPlayback } from '@utils/video-playback'

function createPlyrPlaybackController({ mediaEl }) {
    const player = ref(null)
    const teardownPlayback = ref(null)
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
            const { cleanup } = await setupVideoPlayback({
                videoEl: el,
                sourceUrl,
                exposeHlsGlobally: import.meta.env.DEV
            })
            teardownPlayback.value = cleanup
        } else {
            el.src = sourceUrl
        }
    }

    return {
        destroyPlayers,
        setupPlayerForMedia
    }
}

export function usePlyrMediaLifecycle(props, mediaEl, options = {}) {
    const media = toRef(props, 'media')
    const channelStore = useChannelStore()
    let lifecycleRunId = 0
    const { destroyPlayers, setupPlayerForMedia } = createPlyrPlaybackController({ mediaEl })
    const { onPlaybackReady = null } = options

    async function resolvePlaybackUrl(mediaSnapshot) {
        if (!mediaSnapshot.privateId) {
            throw new Error('Media is missing privateId; cannot create playback session.')
        }

        const result = await channelStore.createMediaSession({ privateId: mediaSnapshot.privateId })
        const session = result?.data
        if (!session?.playbackUrl) {
            throw new Error('Playback session response missing playbackUrl.')
        }

        return session.playbackUrl
    }

    async function syncPlaybackLifecycle() {
        const mediaSnapshot = { ...media.value }
        const runId = ++lifecycleRunId

        destroyPlayers()

        const sourceUrl = await resolvePlaybackUrl(mediaSnapshot)

        if (runId !== lifecycleRunId) return

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
            await syncPlaybackLifecycle()
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
