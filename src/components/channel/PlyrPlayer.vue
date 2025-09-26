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
import Hls from 'hls.js'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

defineOptions({ name: 'PlyrPlayer' })

const props = defineProps({
  media: Object,
  artist: String
})

const player = ref(null)
const hls = ref(null)
let playHandler = null

const view = computed(() => (props.media?.type?.startsWith('audio/') ? 'audio' : 'video'))

function destroyPlayers() {
  if (Hls.isSupported() && hls.value) {
    try {
      hls.value.destroy()
    } catch {}
    hls.value = null
  }
  if (player.value) {
    try {
      player.value.destroy()
    } catch {}
    player.value = null
  }
}

function setSource() {
  const el = document.getElementById('player')
  if (!el || !props.media) return
  player.value = new Plyr(el, {
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
    const source = props.media.src
    if (Hls.isSupported()) {
      hls.value = new Hls()
      hls.value.loadSource(source)
      hls.value.attachMedia(video)
      window.hls = hls.value
    } else if (video) {
      video.src = source
    }
    player.value.poster = props.media.preview
  } else {
    const audio = el.tagName.toLowerCase() === 'audio' ? el : document.querySelector('audio')
    if (audio) {
      audio.src = props.media.src
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
