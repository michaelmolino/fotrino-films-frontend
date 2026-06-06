import { computed, onBeforeUnmount, toRef, watch } from 'vue'

function clearMediaSessionMetadata() {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = null
}

function applyMediaSessionMetadata({ mediaSnapshot, artist, mediaEl, artworkUrl }) {
  if (!('mediaSession' in navigator) || !mediaEl?.value || !mediaSnapshot?.title) return

  const artwork = artworkUrl ? [{ src: artworkUrl }] : []

  navigator.mediaSession.metadata = new MediaMetadata({
    title: mediaSnapshot.title,
    artist,
    artwork
  })
}

export function useMediaSessionMetadata(props, mediaEl, artworkUrl) {
  const media = toRef(props, 'media')
  const artist = toRef(props, 'artist')

  let removeMediaEventListeners = () => {}

  function syncMediaSessionMetadata() {
    const mediaSnapshot = { ...media.value }
    applyMediaSessionMetadata({
      mediaSnapshot,
      artist: artist.value,
      mediaEl,
      artworkUrl: artworkUrl?.value || null
    })
  }

  function bindMediaSessionListeners(el) {
    removeMediaEventListeners()

    if (!el) {
      removeMediaEventListeners = () => {}
      return
    }

    const resyncMetadata = () => {
      syncMediaSessionMetadata()
    }

    el.addEventListener('loadedmetadata', resyncMetadata)
    el.addEventListener('play', resyncMetadata)

    removeMediaEventListeners = () => {
      el.removeEventListener('loadedmetadata', resyncMetadata)
      el.removeEventListener('play', resyncMetadata)
      removeMediaEventListeners = () => {}
    }
  }

  const metadataKey = computed(
    () =>
      `${media.value.privateId}|${media.value.type}|${media.value.preview}|${media.value.title}|${artist.value}|${artworkUrl?.value || ''}`
  )

  watch(
    mediaEl,
    el => {
      bindMediaSessionListeners(el)
    },
    { immediate: true, flush: 'post' }
  )

  watch(
    metadataKey,
    () => {
      syncMediaSessionMetadata()
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    removeMediaEventListeners()
    clearMediaSessionMetadata()
  })

  return {
    syncMediaSessionMetadata,
    clearMediaSessionMetadata
  }
}
