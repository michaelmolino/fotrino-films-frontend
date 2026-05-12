<template>
  <div data-cy="media-player">
    <div v-if="view == 'video'">
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
import { addPreconnectForUrl, addPreloadImageOnce } from '@utils/preconnect'
import { setupTokenizedVideoPlayback } from '@utils/videoPlayback'
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
const view = computed(() => (props.media?.type?.startsWith('audio/') ? 'audio' : 'video'))
const videoPosterUrl = computed(() => props.media?.preview || null)

function onAudioPreviewError() {
  if (audioPreviewSource.value.fallbackUrl && audioPreviewUrl.value !== audioPreviewSource.value.fallbackUrl) {
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

async function fetchMediaToken() {
  if (!props.media?.privateId) return null
  return await channelStore.getMediaToken({ privateId: props.media.privateId })
}

function destroyPlayers() {
  if (teardownPlayback.value) {
    try { teardownPlayback.value() } catch (e) { console.debug(e) }
    teardownPlayback.value = null
  }
  if (player.value) {
    try { player.value.destroy() } catch (e) { console.debug(e) }
    player.value = null
  }
}

async function setupPlayer() {
  const el = document.getElementById(view.value === 'video' ? 'video-player' : 'audio-player')
  if (!el || !props.media) return
  if (view.value === 'video') {
    el.setAttribute('poster', videoPosterUrl.value)
  }
  if (!PlyrCtor) {
    const mod = await import('plyr')
    PlyrCtor = mod.default
  }
  player.value = new PlyrCtor(el, {
    settings: [],
    fullscreen: { iosNative: true },
    controls: [
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
  })

  if (view.value === 'video') {
    const { cleanup } = await setupTokenizedVideoPlayback({
      videoEl: el,
      sourceUrl: props.media.src,
      fetchToken: fetchMediaToken,
      exposeHlsGlobally: import.meta.env.DEV
    })
    teardownPlayback.value = cleanup
  } else {
    // Audio: just set src with token
    const audioToken = await fetchMediaToken()
    el.src = props.media.src + (audioToken ? `?token=${audioToken}` : '')
  }
}

function attachMediaSessionHandler() {
  const el = document.getElementById(view.value === 'video' ? 'video-player' : 'audio-player')
  if (!('mediaSession' in navigator) || !el || !props.media) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: props.media.title,
    artist: props.artist,
    artwork: [{ src: audioPreviewUrl.value || '', type: 'image/jpeg' }]
  })
}

async function rebuild() {
  const runId = ++rebuildRunId
  addPreconnectForUrl(props.media?.src)
  addPreloadImageOnce(audioPreviewUrl.value, 'high')
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
  display: block

.videoEl
  display: block
  width: 100%
  aspect-ratio: 16 / 9

.audioEl
  width: 100%
</style>
