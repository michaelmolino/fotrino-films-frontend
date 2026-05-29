import { computed } from 'vue'
import { buildMediaPath, buildPrivateAlbumMediaPath } from '@utils/channel-route.js'

export function useMediaRootViewModel({ loading, channel, album, media, route }) {
  const privateMode = computed(() => !!route.params.privateMediaId)
  const privateScope = computed(() => (route.params.privateAlbumId ? 'album' : 'media'))

  const contentState = computed(() => {
    if (loading.value) return 'loading'
    const hasTargetMedia = !!(route.params.privateMediaId || route.params.mediaPublicId)
    return channel.value && album.value && media.value && hasTargetMedia ? 'ready' : 'not-found'
  })

  const albumPoster = computed(() => album.value?.poster || null)
  const albumPosterColor = computed(() => album.value?.posterColor || null)

  const relatedMedia = computed(() => {
    const currentPrivateId = media.value?.privateId
    return (album.value?.media || []).filter(m => m?.privateId && m.privateId !== currentPrivateId)
  })

  const showRelatedContent = computed(() => {
    const isPublicMedia = !!route.params.mediaPublicId
    const isPrivateAlbumMedia = !!route.params.privateAlbumId && !!route.params.privateMediaId
    return (isPublicMedia || isPrivateAlbumMedia) && relatedMedia.value.length > 0
  })

  function getRelatedPath(related) {
    if (route.params.privateAlbumId) {
      return buildPrivateAlbumMediaPath({
        privateAlbumId: route.params.privateAlbumId,
        privateMediaId: related.privateId,
        mediaSlug: related.slug
      })
    }
    return buildMediaPath({ publicId: related.publicId, slug: related.slug })
  }

  const relatedCards = computed(() => {
    return relatedMedia.value.map((related, index) => ({
      id: related.privateId,
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
