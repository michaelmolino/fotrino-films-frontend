import { computed } from 'vue'
import { buildMediaPathForRouteContext } from '@utils/channel-route.js'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

export function useMediaRootViewModel({ loading, channel, album, media, routeContext }) {
  const contentState = computed(() => {
    if (loading.value) return 'loading'
    const hasTargetMedia = routeContext.value.hasMediaTarget
    return channel.value && album.value && media.value && hasTargetMedia ? 'ready' : 'not-found'
  })

  const albumPoster = computed(() => resolveImagePrimaryUrl(album.value?.posterAsset) || null)
  const albumPosterColor = computed(() => album.value?.posterColor || null)

  const relatedMedia = computed(() => {
    const currentPrivateId = media.value?.privateId
    return (album.value?.media || []).filter(m => m?.privateId && m.privateId !== currentPrivateId)
  })

  const showRelatedContent = computed(() => {
    const isPublicMedia = routeContext.value.type === 'media'
    const isPrivateAlbumMedia = routeContext.value.type === 'privateAlbumMedia'
    return (isPublicMedia || isPrivateAlbumMedia) && relatedMedia.value.length > 0
  })

  function getRelatedPath(related) {
    return buildMediaPathForRouteContext({
      context: routeContext.value,
      album: album.value,
      media: related
    })
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
    contentState,
    albumPoster,
    albumPosterColor,
    relatedMedia,
    showRelatedContent,
    relatedCards,
    getRelatedPath
  }
}
