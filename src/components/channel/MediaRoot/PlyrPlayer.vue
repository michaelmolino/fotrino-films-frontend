<template>
  <div data-cy="media-player" :class="['media-player-shell', { 'portrait-mode': isPortraitVideo }]">
    <div v-if="isVideoView" class="video-shell">
      <div
        v-if="isPortraitVideo"
        class="portrait-backdrop"
        :style="portraitBackdropStyle"
        aria-hidden="true"></div>
      <div :class="['video-frame', { 'video-frame-portrait': isPortraitVideo }]">
        <video
          id="video-player"
          controls
          x-webkit-airplay="allow"
          :key="media.id"
          :aria-label="`Video player for ${media.title}`"
          preload="metadata"
          data-cy="video-player"
          class="videoEl"></video>
      </div>
    </div>
    <div v-else class="audio-container">
      <picture v-if="media.preview" class="audio-preview">
        <img
          :src="audioPreviewUrl"
          :alt="`${media.title} cover art`"
          fetchpriority="high"
          @error="onAudioPreviewError"
          class="audio-img" />
      </picture>
      <audio
        id="audio-player"
        controls
        :key="media.id"
        :aria-label="`Audio player for ${media.title}`"
        data-cy="audio-player"
        class="audioEl"></audio>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import 'plyr/dist/plyr.css'
import '@css/plyr.sass'
import { setupVideoPlayback } from '@utils/videoPlayback'
import { useWebP } from '@composables/useWebP'

const props = defineProps({
  media: Object,
  artist: String
})

const channelStore = useChannelStore()
const player = ref(null)
const teardownPlayback = ref(null)
let rebuildRunId = 0
let PlyrCtor = null
const { resolvePreviewSource } = useWebP()
const audioPreviewSource = ref({ strategy: 'original-only', primaryUrl: null, fallbackUrl: null })
const audioPreviewUrl = ref(null)
const playbackUrl = ref(null)
const view = computed(() => (props.media?.type?.startsWith('audio/') ? 'audio' : 'video'))
const isVideoView = computed(() => view.value === 'video')
const mediaElementId = computed(() => (isVideoView.value ? 'video-player' : 'audio-player'))
const videoPosterUrl = computed(() => props.media?.preview || null)
const isPortraitVideo = computed(
  () => view.value === 'video' && props.media?.orientation === 'portrait'
)
const portraitBackdropStyle = computed(() => {
  if (!videoPosterUrl.value) return {}
  return { backgroundImage: `url("${videoPosterUrl.value}")` }
})

function onAudioPreviewError() {
  if (
    audioPreviewSource.value.fallbackUrl &&
    audioPreviewUrl.value !== audioPreviewSource.value.fallbackUrl
  ) {
    audioPreviewUrl.value = audioPreviewSource.value.fallbackUrl
  }
}

async function refreshAudioPreviewSource() {
  audioPreviewSource.value = { strategy: 'original-only', primaryUrl: null, fallbackUrl: null }
  audioPreviewUrl.value = null
  if (!props.media?.preview) return
  const source = await resolvePreviewSource(props.media.preview)
  audioPreviewSource.value = source
  audioPreviewUrl.value = source.primaryUrl || props.media.preview
}

function destroyPlayers() {
  if (teardownPlayback.value) {
    try {
      teardownPlayback.value()
    } catch (e) {
      console.debug(e)
    }
    teardownPlayback.value = null
  }
  if (player.value) {
    try {
      player.value.destroy()
    } catch (e) {
      console.debug(e)
    }
    player.value = null
  }
}

async function refreshPlaybackUrl() {
  if (!props.media?.privateId) {
    playbackUrl.value = props.media?.src || null
    return
  }

  try {
    const result = await channelStore.createMediaSession({ privateId: props.media.privateId })
    const session = result?.data
    playbackUrl.value = session?.playbackUrl || props.media?.src || null
  } catch (error) {
    console.debug('Failed to initialize playback URL:', error)
    playbackUrl.value = props.media?.src || null
  }
}

async function setupPlayer() {
  const el = document.getElementById(mediaElementId.value)
  if (!el || !props.media) return
  const sourceUrl = playbackUrl.value || props.media.src
  const controls = isPortraitVideo.value
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

  if (isVideoView.value) {
    if (videoPosterUrl.value) {
      el.setAttribute('poster', videoPosterUrl.value)
    } else {
      el.removeAttribute('poster')
    }
  }
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

  // Auto-fullscreen for all videos on play
  if (view.value === 'video') {
    let hasAutoFullscreened = false
    player.value.on('play', () => {
      if (!hasAutoFullscreened) {
        hasAutoFullscreened = true
        player.value.fullscreen.enter()
      }
    })
  }

  if (isVideoView.value) {
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

function attachMediaSessionHandler() {
  const el = document.getElementById(mediaElementId.value)
  if (!('mediaSession' in navigator) || !el || !props.media) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: props.media.title,
    artist: props.artist,
    artwork: [{ src: audioPreviewUrl.value || '', type: 'image/jpeg' }]
  })
}

async function rebuild() {
  const runId = ++rebuildRunId
  await refreshPlaybackUrl()
  destroyPlayers()
  await nextTick()
  if (runId !== rebuildRunId) return
  await setupPlayer()
  if (runId !== rebuildRunId) {
    destroyPlayers()
    return
  }
  attachMediaSessionHandler()
}

onMounted(async () => {
  await refreshAudioPreviewSource()
  await rebuild()
})

onBeforeUnmount(() => {
  rebuildRunId += 1
  destroyPlayers()
})

watch(
  () => props.media?.id,
  async () => {
    await refreshAudioPreviewSource()
    await rebuild()
  }
)
</script>

<style lang="sass" scoped>
.audio-container
  position: relative
  width: 100%

.audio-preview
  display: block
  width: 100%
  aspect-ratio: 16 / 9
  overflow: hidden

.audio-img
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 28%
  display: block

.videoEl
  display: block
  width: 100%
  aspect-ratio: 16 / 9

.audioEl
  width: 100%

.video-shell
  width: 100%

.video-frame
  width: 100%

.video-frame-portrait .videoEl
  width: 100%
  height: 100%
  aspect-ratio: 9 / 16
  object-fit: contain

.media-player-shell.portrait-mode
  .video-shell
    width: 100%
    display: flex
    align-items: center
    justify-content: center
    position: relative
    min-height: 400px
    overflow: hidden
    background: linear-gradient(180deg, rgba(15, 15, 15, 0.96), rgba(0, 0, 0, 0.98))

  .portrait-backdrop
    position: absolute
    inset: 0
    background-size: cover
    background-position: 50% 28%
    filter: blur(28px) saturate(2)
    transform: scale(1.15)
    opacity: 1
    pointer-events: none

  .video-shell::after
    content: ''
    position: absolute
    inset: 0
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.65))
    z-index: 1
    pointer-events: none

  .video-frame
    position: relative
    z-index: 2
    width: auto
    max-width: 100%
    max-height: 60vh
    aspect-ratio: 9 / 16

  :deep(.plyr)
    width: 100%
    height: 100%

  :deep(.plyr--video .plyr__video-wrapper)
    padding-bottom: 0
    background: transparent
</style>
