<template>
  <div>
    <div v-if="view == 'video'">
      <video id="player" controls :key="media.id" class="videoEl" />
    </div>
    <div v-else>
      <q-img :src="media.preview" :ratio="16 / 9" fit="cover" class="full-width" />
      <audio id="player" controls :key="media.id" class="audioEl"></audio>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import Hls from 'hls.js'

const props = defineProps({
  media: Object,
  artist: String
})

const store = useStore()
const player = ref(null)
const hls = ref(null)
let playHandler = null

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
  const el = document.getElementById('player')
  if (!el || !props.media) return
  const PlyrCtor = window.Plyr
  if (!PlyrCtor) return
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
      window.hls = hls.value

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
            alert('Unable to refresh video token. Please try again later.')
          }
        }
      })
    } else if (video) {
      video.src = queryParams ? source + '?' + queryParams : source
    }
    player.value.poster = props.media.preview
  } else {
    const audio = el.tagName.toLowerCase() === 'audio' ? el : document.querySelector('audio')
    if (audio) {
      audio.src = props.media.src + `?token=${token}`
      audio.type = props.media.type
    }
  }
}

function attachMediaSessionHandler() {
  const el = document.getElementById('player')
  if (!('mediaSession' in navigator) || !el || !props.media) return
  if (playHandler) el.removeEventListener('play', playHandler)
  playHandler = () => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: props.media.title,
      artist: props.artist,
      artwork: [{ src: props.media.preview, type: 'image/jpeg' }]
    })
  }
  el.addEventListener('play', playHandler, { once: true })
}

async function rebuild() {
  destroyPlayers()
  await nextTick()
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
