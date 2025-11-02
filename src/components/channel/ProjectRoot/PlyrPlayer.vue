<template>
  <div>
    <div v-if="view == 'video'">
      <video id="video-player" controls :key="media.id" class="videoEl"></video>
    </div>
    <div v-else>
      <q-img :src="previewSrc" :ratio="16 / 9" fit="cover" class="full-width" />
      <audio id="audio-player" controls :key="media.id" class="audioEl"></audio>
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
const previewSrc = ref(props.media?.preview)

const view = computed(() => (props.media?.type?.startsWith('audio/') ? 'audio' : 'video'))

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

async function setSource() {
  const el = document.getElementById(view.value === 'video' ? 'video-player' : 'audio-player')
  if (!el || !props.media) return
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

  // Fetch JWT token for secure media access
  const token = await fetchMediaToken()

  if (view.value === 'video') {
    const video = el.tagName.toLowerCase() === 'video' ? el : document.querySelector('video')
    const source = props.media.src
    const queryParams = token ? `token=${token}` : null

    // Preload poster (LCP candidate) with high priority
    if (previewSrc.value) addPreloadImageOnce(previewSrc.value, 'high')

    // Preconnect to HLS segment origin
    addPreconnectForUrl(source)

    if (Hls.isSupported()) {
      let currentQueryParams = queryParams
      hls.value = new Hls({
        xhrSetup: function (xhr, url) {
          // Append query parameters to all segment and playlist requests
          if (currentQueryParams) {
            xhr.open('GET', url + '?' + currentQueryParams, true)
          }
        }
      })
      hls.value.loadSource(source)
      hls.value.attachMedia(video)
      globalThis.hls = hls.value

      // Intercept 403 errors and retry with a fresh token
      hls.value.on(Hls.Events.ERROR, async function (event, data) {
        if (data.response && data.response.code === 403) {
          const newToken = await fetchMediaToken()
          if (newToken) {
            currentQueryParams = `token=${newToken}`
            const currentTime = video.currentTime
            hls.value.loadSource(source)
            hls.value.attachMedia(video)
            const restorePlayback = () => {
              if (Math.abs(video.currentTime - currentTime) > 0.5 && currentTime > 0) {
                video.currentTime = currentTime
              }
              video.play()
              video.removeEventListener('loadedmetadata', restorePlayback)
            }
            video.addEventListener('loadedmetadata', restorePlayback)
            hls.value.once(Hls.Events.MANIFEST_PARSED, restorePlayback)
          } else {
            player.value && player.value.destroy()
            globalThis.alert('Unable to refresh video token. Please try again later.')
          }
        }
      })
    } else if (video) {
      video.src = queryParams ? source + '?' + queryParams : source
    }
    player.value.poster = previewSrc.value
  } else {
    const audio = el.tagName.toLowerCase() === 'audio' ? el : document.querySelector('audio')
    if (audio) {
      audio.src = props.media.src + `?token=${token}`
      audio.type = props.media.type
    }
    addPreconnectForUrl(props.media.src)
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
      artwork: [{ src: previewSrc.value, type: 'image/jpeg' }]
    })
  }
  el.addEventListener('play', playHandler, { once: true })
}

async function rebuild() {
  destroyPlayers()
  await nextTick()
  // Check for WebP version before setting source
  if (props.media?.preview) {
    previewSrc.value = await checkWebPVersion(props.media.preview)
  }
  setSource()
  attachMediaSessionHandler()
}

onMounted(() => {
  rebuild()
})

onBeforeUnmount(() => {
  destroyPlayers()
})

watch(
  () => props.media?.id,
  async () => {
    await rebuild()
  }
)

watch(view, async () => {
  await rebuild()
})
</script>

<style>
:root {
  --plyr-color-main: #8d6a9f;
}
.videoEl {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.audioEl {
  width: 100%;
}
</style>
