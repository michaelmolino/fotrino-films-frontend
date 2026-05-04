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
  if (!props.media?.preview) {
    return
  }
  const source = await resolvePreviewSource(props.media.preview)
  audioPreviewSource.value = source
  audioPreviewUrl.value = source.primaryUrl || props.media.preview
}

async function fetchMediaToken() {
  if (!props.media?.privateId) return null
  return await store.dispatch('channel/getMediaToken', props.media.privateId)
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
    await setupVideoPlayer(el)
  } else {
    setupAudioPlayer(el)
  }
  setupPlyrEndedHandler()
}

function setupPlyrEndedHandler() {
  if (view.value !== 'video' || !player.value || typeof player.value.on !== 'function') return
  const _onEnded = () => {
    try {
      player.value.stop()
    } catch (e) {
      console.error('Error stopping player:', e)
    }
  }
  try {
    player.value.on('ended', _onEnded)
  } catch (e) {
    console.error('Error attaching ended event:', e)
  }

  const _origDestroy = player.value.destroy?.bind(player.value)
  if (_origDestroy) {
    player.value.destroy = function () {
      try {
        player.value.off && player.value.off('ended', _onEnded)
      } catch (e) {
        console.error('Error detaching ended event:', e)
      }
      _origDestroy()
    }
  }
}

async function setupAudioPlayer(el) {
  const audio = el.tagName.toLowerCase() === 'audio' ? el : document.querySelector('audio')
  if (audio) {
    const audioToken = await fetchMediaToken()
    audio.src = props.media.src + `?token=${audioToken}`
    audio.type = props.media.type
  }
}

async function setupVideoPlayer(el) {
  const video = el.tagName.toLowerCase() === 'video' ? el : document.querySelector('video')
  const source = props.media.src
  const nativeHlsMimeTypes = ['application/vnd.apple.mpegurl', 'application/x-mpegURL']
  // Mutable token state shared by xhrSetup and the play-guard.
  const tokenState = { value: null, issuedAt: 0, exp: 0 }

  function supportsNativeHls() {
    return nativeHlsMimeTypes.some((mimeType) => video.canPlayType(mimeType))
  }

  function getExpFromJwt(t) {
    try {
      const part = t.split('.')[1]
      const base64 = part.replaceAll('-', '+').replaceAll('_', '/')
      const json = JSON.parse(decodeURIComponent(escape(globalThis.atob(base64))))
      return json?.exp ? json.exp * 1000 : null
    } catch {
      return null
    }
  }

  function isTokenStale() {
    if (!tokenState.value || !tokenState.exp) return true
    const halfLife = (tokenState.exp - tokenState.issuedAt) / 2
    return Date.now() >= tokenState.issuedAt + halfLife
  }

  async function refreshToken() {
    const t = await fetchMediaToken()
    if (t) {
      tokenState.value = t
      tokenState.issuedAt = Date.now()
      tokenState.exp = getExpFromJwt(t) ?? 0
    }
  }

  function buildTokenUrl(url) {
    if (!tokenState.value) return url
    const [base, query] = url.split('?')
    const params = new URLSearchParams(query)
    params.delete('token')
    params.set('token', tokenState.value)
    return `${base}?${params.toString()}`
  }

  await refreshToken()

  if (supportsNativeHls()) {
    video.src = buildTokenUrl(source)
    video.load()
    // On play, if the token is at or past its half-life, reload the manifest
    // with a fresh token and seek back to where the user left off.
    video.addEventListener('play', async function onPlayGuard() {
      if (!isTokenStale()) return
      video.pause()
      const resumeAt = video.currentTime
      await refreshToken()
      video.src = buildTokenUrl(source)
      video.load()
      await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }))
      video.currentTime = resumeAt
      video.play().catch(() => {})
    })
    return
  }

  if (!Hls.isSupported()) {
    console.error('HLS is not supported in this browser.')
    return
  }

  hls.value = new Hls({
    capLevelToPlayerSize: false,
    abrEwmaDefaultEstimate: 3000000,
    // xhrSetup reads tokenState.value on every request, so a token refreshed
    // by the play-guard is picked up automatically without reloading anything.
    xhrSetup: function (xhr, url) {
      xhr.open('GET', buildTokenUrl(url), true)
    }
  })

  hls.value.loadSource(buildTokenUrl(source))
  hls.value.attachMedia(video)
  globalThis.hls = hls.value

  // On play, if the token is at or past its half-life, refresh it.
  // xhrSetup will use the new value for all subsequent segment/manifest requests.
  // No source reload needed — the buffer is untouched.
  video.addEventListener('play', async function onPlayGuard() {
    if (!isTokenStale()) return
    await refreshToken()
  })
}

function attachMediaSessionHandler() {
  const el = document.getElementById(view.value === 'video' ? 'video-player' : 'audio-player')
  if (!('mediaSession' in navigator) || !el || !props.media) return
  if (playHandler) el.removeEventListener('play', playHandler)
  playHandler = () => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: props.media.title,
      artist: props.artist,
      artwork: [{ src: audioPreviewUrl.value || '', type: 'image/jpeg' }]
    })
  }
  el.addEventListener('play', playHandler, { once: true })
}

async function rebuild() {
  addPreconnectForUrl(props.media?.src)
  addPreloadImageOnce(audioPreviewUrl.value, 'high')
  destroyPlayers()
  await nextTick()
  setupPlayer()
  attachMediaSessionHandler()
}

onMounted(async () => {
  await refreshAudioPreviewSource()
  rebuild()
})

onBeforeUnmount(() => {
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
