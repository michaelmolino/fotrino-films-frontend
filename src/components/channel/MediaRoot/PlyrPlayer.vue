<template>
  <div data-cy="media-player" class="media-player-shell" :class="{ 'portrait-mode': isPortraitVideo }">
    <div v-if="isVideoView" class="video-shell">
      <div
        v-if="isPortraitVideo"
        class="portrait-backdrop"
        :style="portraitBackdropStyle"
        aria-hidden="true"></div>
      <div :class="['video-frame', { 'video-frame-portrait': isPortraitVideo }]">
        <video
          ref="mediaEl"
          controls
          x-webkit-airplay="allow"
          :key="mediaElementKey"
          :aria-label="`Video player for ${media.title}`"
          :poster="!isPortraitVideo ? mediaPreviewUrl : null"
          preload="none"
          data-cy="video-player"
          class="videoEl"></video>
      </div>
    </div>
    <div v-else class="audio-container">
      <picture v-if="media.preview" class="audio-preview">
        <img
          :src="mediaPreviewUrl"
          :alt="`${media.title} cover art`"
          fetchpriority="high"
          class="audio-img"
          @error="onMediaPreviewError" />
      </picture>
      <audio
        ref="mediaEl"
        controls
        :key="mediaElementKey"
        :aria-label="`Audio player for ${media.title}`"
        data-cy="audio-player"
        class="audioEl"></audio>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import 'plyr/dist/plyr.css'
import '@css/plyr.sass'
import { usePlyrMediaLifecycle } from '@composables/usePlyrMediaLifecycle'
import { useMediaSessionMetadata } from '@composables/useMediaSessionMetadata'
import { useWebP } from '@composables/useWebP'

const props = defineProps({
  media: {
    type: Object,
    required: true
  },
  artist: {
    type: String,
    required: true
  }
})

const mediaEl = ref(null)
const { resolvePreviewSource } = useWebP()
const view = computed(() => (props.media.type.startsWith('audio/') ? 'audio' : 'video'))
const isVideoView = computed(() => view.value === 'video')
const mediaElementKey = computed(() => `${view.value}:${props.media.privateId}`)
const mediaPreviewUrl = ref(null)
const isPortraitVideo = computed(() => view.value === 'video' && props.media.orientation === 'portrait')
const portraitBackdropStyle = computed(() => {
  if (!mediaPreviewUrl.value) return {}
  return { backgroundImage: `url("${mediaPreviewUrl.value}")` }
})

let previewRunId = 0

function onMediaPreviewError() {
  mediaPreviewUrl.value = null
}

watch(
  () => props.media.previewAsset,
  async preview => {
    const runId = ++previewRunId

    mediaPreviewUrl.value = null

    if (!preview) return

    const resolvedSource = await resolvePreviewSource(preview)
    if (runId !== previewRunId) return

    mediaPreviewUrl.value = resolvedSource.url
  },
  { immediate: true }
)

const { syncMediaSessionMetadata } = useMediaSessionMetadata(props, mediaEl, mediaPreviewUrl)

usePlyrMediaLifecycle(props, mediaEl, { onPlaybackReady: syncMediaSessionMetadata })
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
