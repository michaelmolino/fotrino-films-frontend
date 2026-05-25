import { computed } from 'vue'

export function useMediaRootViewModel({ loading, channel, album, media, route }) {
  const privateMode = computed(() => !!route.params.privateMediaId)
  const privateScope = computed(() => (route.params.privateAlbumId ? 'album' : 'media'))

  const contentState = computed(() => {
    if (loading.value) return 'loading'
    const hasTargetMedia = !!(route.params.privateMediaId || route.params.mediaId)
    return channel.value && album.value && media.value && hasTargetMedia ? 'ready' : 'not-found'
  })

  const albumPoster = computed(() => album.value?.poster || null)
  const albumPosterColor = computed(() => album.value?.posterColor || null)

  const relatedMedia = computed(() => {
    return (album.value?.media || []).filter(
      m => (m.id || m.privateId) !== (media.value?.id || media.value?.privateId)
    )
  })

  const showRelatedContent = computed(() => {
    const isPublicMedia = !!route.params.mediaId
    const isPrivateAlbumMedia = !!route.params.privateAlbumId && !!route.params.privateMediaId
    return (isPublicMedia || isPrivateAlbumMedia) && relatedMedia.value.length > 0
  })

  function getRelatedPath(related) {
    if (route.params.privateAlbumId) {
      return `/private/a/${route.params.privateAlbumId}/m/${related.privateId}/${related.slug}`
    }
    return `/m/${related.publicId}/${related.slug}`
  }

  const relatedCards = computed(() => {
    return relatedMedia.value.map((related, index) => ({
      id: related.id,
      media: related,
      to: getRelatedPath(related),
      priority: index === 0 ? 'high' : 'auto'
    }))
  })

  return {
    privateMode,
    privateScope,
    contentState,
    albumPoster,
    albumPosterColor,
    relatedMedia,
    showRelatedContent,
    relatedCards,
    getRelatedPath
  }
}
