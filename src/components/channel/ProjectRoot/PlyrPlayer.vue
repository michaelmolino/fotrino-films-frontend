<template>
  <div>
    <div v-if="view == 'video'">
      <video
        id="video-player"
        controls
        x-webkit-airplay="allow"
        :key="media.id"
        :aria-label="`Video player for ${media.title}`"
        preload="metadata"
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
    await setupVideoPlayer(el, token)
  } else {
    setupAudioPlayer(el, token)
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

function setupAudioPlayer(el, token) {
  const audio = el.tagName.toLowerCase() === 'audio' ? el : document.querySelector('audio')
  if (audio) {
    audio.src = props.media.src + `?token=${token}`
    audio.type = props.media.type
  }
}

async function setupVideoPlayer(el, token) {
  const video = el.tagName.toLowerCase() === 'video' ? el : document.querySelector('video')
  let source = props.media.src
  if (!Hls.isSupported()) {
    console.error('HLS is not supported in this browser.')
    return
  }
  let currentToken = token || null
  let retrying = false
  let retries = 0
  let tokenRefreshTimer = null
  const MAX_RETRIES = 2

  function getExpFromJwt(t) {
    try {
      const part = t.split('.')[1]
      const base64 = part.replaceAll('-', '+').replaceAll('_', '/')
      const json = JSON.parse(decodeURIComponent(escape(globalThis.atob(base64))))
      return (json && json.exp) ? json.exp * 1000 : null
    } catch (err) {
      console.debug('Failed to parse JWT exp', err)
      return null
    }
  }

  function scheduleTokenRefresh(tokenVal) {
    try {
      const expMs = getExpFromJwt(tokenVal)
      if (!expMs) return
      const now = Date.now()
      const msUntil = expMs - now - 20000
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
        tokenRefreshTimer = null
      }
      if (msUntil > 0) {
        tokenRefreshTimer = setTimeout(async () => {
          try {
            const refreshed = await fetchMediaToken()
            if (refreshed && refreshed !== currentToken) {
              currentToken = refreshed
              scheduleTokenRefresh(refreshed)
            }
          } catch (e) {
            console.debug('Token refresh failed', e)
          }
        }, msUntil)
      }
    } catch {
      /* no-op */
    }
  }

  async function obtainTokenAndSchedule() {
    const t = await fetchMediaToken()
    if (t) {
      const changed = t !== currentToken
      currentToken = t
      scheduleTokenRefresh(t)
      return changed
    }
    return false
  }

  function rewriteUrlWithNewToken(u) {
    if (!u) return u
    const [base, query] = u.split('?')
    const params = new URLSearchParams(query)
    params.delete('token')
    if (currentToken) params.set('token', currentToken)
    return `${base}?${params.toString()}`
  }

  hls.value = new Hls({
    capLevelToPlayerSize: false,
    abrEwmaDefaultEstimate: 3000000,
    xhrSetup: function (xhr, url) {
      xhr.open('GET', rewriteUrlWithNewToken(url), true)
    }
  })

  hls.value.on(Hls.Events.FRAG_LOADING, function (_event, data) {
    try {
      const frag = data?.frag
      if (!frag) return
      if (Array.isArray(frag.url)) {
        frag.url = frag.url.map(rewriteUrlWithNewToken)
      } else if (typeof frag.url === 'string') {
        frag.url = rewriteUrlWithNewToken(frag.url)
      }
    } catch (e) {
      console.debug('Failed to rewrite frag URL', e)
    }
  })

  await obtainTokenAndSchedule()
  hls.value.loadSource(source)
  hls.value.attachMedia(video)
  globalThis.hls = hls.value

  hls.value.on(Hls.Events.ERROR, async function (_event, data) {
    console.debug('HLS ERROR', data, { retrying, retries, currentToken })
    if (data?.response?.code !== 403) return
    if (retrying || retries >= MAX_RETRIES) {
      console.error('Media token refresh failed after retries.')
      try {
        player.value?.destroy()
      } catch (err) {
        console.error('Error destroying player after token refresh failure:', err)
      }
      return
    }
    retrying = true
    retries += 1
    const changed = await obtainTokenAndSchedule()
    if (!changed && retries < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 300 * retries))
      retrying = false
      return
    }
    retrying = false
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
      artwork: [{ src: mediaPreviewUrl.value || '', type: 'image/jpeg' }]
    })
  }
  el.addEventListener('play', playHandler, { once: true })
}

async function rebuild() {
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
