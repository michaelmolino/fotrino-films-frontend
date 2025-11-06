<template>
  <div>
    <div v-if="view == 'video'">
      <video
        id="video-player"
        controls
        :key="media.id"
        :aria-label="`Video player for ${media.title}`"
        preload="metadata"
        fetchpriority="high"
        class="videoEl"></video>
    </div>
    <div v-else class="audio-container">
      <picture v-if="media.preview" class="audio-preview">
        <img
          :src="mediaPreviewUrl"
          :alt="`${media.title} cover art`"
          fetchpriority="high"
          class="audio-img" />
      </picture>
      <audio
        id="audio-player"
        controls
        :key="media.id"
        :aria-label="`Audio player for ${media.title}`"
        class="audioEl"></audio>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import Hls from 'hls.js'
import 'plyr/dist/plyr.css'
import { addPreconnectForUrl, addPreloadImageOnce } from '@utils/preconnect'
import { useWebP } from '@composables/useWebP'

const props = defineProps({
  media: Object,
  artist: String
})

const store = useStore()
const player = ref(null)
const hls = ref(null)
let playHandler = null
let PlyrCtor = null
const { checkWebPVersion } = useWebP()
const webpUrl = ref(null)
const view = computed(() => (props.media?.type?.startsWith('audio/') ? 'audio' : 'video'))
const mediaPreviewUrl = computed(() => webpUrl.value || props.media?.preview || null)

async function refreshWebp() {
  webpUrl.value = null
  if (props.media?.preview) {
      const url = await checkWebPVersion(props.media.preview)
      if (url && url !== props.media.preview && url.endsWith('.webp')) {
        webpUrl.value = url
      }
  }
}

async function fetchMediaToken() {
  if (!props.media?.private_id) return null
  return await store.dispatch('channel/getMediaToken', props.media.private_id)
}

function destroyPlayers() {
  if (Hls.isSupported() && hls.value) {
    try {
      hls.value.destroy()
    } catch (e) {
      console.debug(e)
    }
    hls.value = null
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

async function setupPlayer(token) {
  const el = document.getElementById(view.value === 'video' ? 'video-player' : 'audio-player')
  if (!el || !props.media) return
  if (view.value === 'video') {
    el.setAttribute('poster', mediaPreviewUrl.value)
  }
  if (!PlyrCtor) {
    const mod = await import('plyr')
    PlyrCtor = mod.default
  }
  player.value = new PlyrCtor(el, {
    settings: [],
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
      'airplay',
      'fullscreen'
    ]
  })

  if (view.value === 'video') {
    const video = el.tagName.toLowerCase() === 'video' ? el : document.querySelector('video')
    let source = props.media.src

    if (Hls.isSupported()) {
      let currentToken = token || null
      let retrying = false
      let retries = 0
      const MAX_RETRIES = 2

      hls.value = new Hls({
        capLevelToPlayerSize: false,
        abrEwmaDefaultEstimate: 3000000,
        xhrSetup: function (xhr, url) {
          const hasQuery = url.includes('?')
          const sep = hasQuery ? '&' : '?'
          const tokenPart = currentToken ? `${sep}token=${encodeURIComponent(currentToken)}` : ''
          xhr.open('GET', url + tokenPart, true)
        }
      })
      hls.value.loadSource(source)
      hls.value.attachMedia(video)
      globalThis.hls = hls.value

      hls.value.on(Hls.Events.ERROR, async function (_event, data) {
        if (data?.response?.code !== 403) return
        if (retrying || retries >= MAX_RETRIES) {
          try { player.value?.destroy() } catch { /* no-op */ }
          console.error('Media token refresh failed after retries.')
          return
        }
        retrying = true
        retries += 1
        const newToken = await fetchMediaToken()
        if (!newToken) {
          try { player.value?.destroy() } catch { /* no-op */ }
          console.error('Unable to refresh video token. Please try again later.')
          retrying = false
          return
        }
        currentToken = newToken
        const currentTime = video.currentTime
        // Reload original source; xhrSetup will append the updated token for all requests
        hls.value.loadSource(props.media.src)
        hls.value.attachMedia(video)
        const restorePlayback = () => {
          if (Math.abs(video.currentTime - currentTime) > 0.5 && currentTime > 0) {
            video.currentTime = currentTime
          }
          video.play().catch(() => {})
          video.removeEventListener('loadedmetadata', restorePlayback)
          retrying = false
        }
        video.addEventListener('loadedmetadata', restorePlayback)
        if (typeof hls.value.once === 'function') {
          hls.value.once(Hls.Events.MANIFEST_PARSED, restorePlayback)
        } else {
          const handler = () => { restorePlayback(); hls.value.off?.(Hls.Events.MANIFEST_PARSED, handler) }
          hls.value.on(Hls.Events.MANIFEST_PARSED, handler)
        }
      })
    } else {
      console.error('HLS is not supported in this browser.')
    }
  } else {
    const audio = el.tagName.toLowerCase() === 'audio' ? el : document.querySelector('audio')
    if (audio) {
      audio.src = props.media.src + `?token=${token}`
      audio.type = props.media.type
    }
  }
}

function attachMediaSessionHandler() {
  const el = document.getElementById(view.value === 'video' ? 'video-player' : 'audio-player')
  if (!('mediaSession' in navigator) || !el || !props.media) return
  if (playHandler) el.removeEventListener('play', playHandler)
  playHandler = () => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: props.media.title,
      artist: props.artist,
      artwork: [{ src: mediaPreviewUrl.value || '', type: 'image/jpeg' }]
    })
  }
  el.addEventListener('play', playHandler, { once: true })
}

async function rebuild() {
  console.log('Rebuilding PlyrPlayer for media ID:', props.media?.id)
  addPreconnectForUrl(props.media?.src)
  addPreloadImageOnce(mediaPreviewUrl.value, 'high')
  destroyPlayers()
  await nextTick()
  const token = await fetchMediaToken()
  setupPlayer(token)
  attachMediaSessionHandler()
}

onMounted(async () => {
  await refreshWebp()
  rebuild()
})

onBeforeUnmount(() => {
  destroyPlayers()
})

watch(
  () => props.media?.id,
  async () => {
    await refreshWebp()
    await rebuild()
  }
)
</script>

<style>
:root {
  --plyr-color-main: #8d6a9f;
}
.audio-container {
  position: relative;
  width: 100%;
}
.audio-preview {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.audio-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.videoEl {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
}
.audioEl {
  width: 100%;
}
</style>
