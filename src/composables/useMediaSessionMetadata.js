import { computed, onBeforeUnmount, toRef, watch } from 'vue'

function clearMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = null
}

function applyMediaSessionMetadata({ mediaSnapshot, artist }) {
    if (!('mediaSession' in navigator)) return

    const isVideo = !mediaSnapshot.type.startsWith('audio/')
    const artwork = isVideo || !mediaSnapshot.preview ? [] : [{ src: mediaSnapshot.preview }]

    navigator.mediaSession.metadata = new MediaMetadata({
        title: mediaSnapshot.title,
        artist,
        artwork
    })
}

export function useMediaSessionMetadata(props) {
    const media = toRef(props, 'media')
    const artist = toRef(props, 'artist')

    const metadataKey = computed(
        () =>
            `${media.value.privateId}|${media.value.type}|${media.value.preview}|${media.value.title}|${artist.value}`
    )

    watch(
        metadataKey,
        () => {
            const mediaSnapshot = { ...media.value }
            applyMediaSessionMetadata({ mediaSnapshot, artist: artist.value })
        },
        { immediate: true }
    )

    onBeforeUnmount(() => {
        clearMediaSessionMetadata()
    })

    return {
        clearMediaSessionMetadata
    }
}
