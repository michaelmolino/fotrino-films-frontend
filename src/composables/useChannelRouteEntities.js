import { computed } from 'vue'

export function useAlbumRouteEntities({ channel, routeContext, findAlbumByPublicId }) {
  const album = computed(() => {
    const context = routeContext.value
    if (context.type === 'privateAlbum' || context.type === 'privateAlbumMedia') {
      return channel.value?.album || null
    }
    if (context.type === 'album') {
      return findAlbumByPublicId(context.albumPublicId)
    }
    return null
  })

  return {
    album
  }
}

export function useMediaRouteEntities({
  channel,
  routeContext,
  findAlbumByMediaPublicId,
  findMediaByPublicId
}) {
  const album = computed(() => {
    const context = routeContext.value
    if (context.type === 'media') {
      return findAlbumByMediaPublicId(context.mediaPublicId)
    }
    if (context.isPrivate) {
      return channel.value?.album || null
    }
    return null
  })

  const media = computed(() => {
    const context = routeContext.value
    const currentAlbum = album.value
    if (!currentAlbum) return null

    const mediaItems = currentAlbum.media || []

    if (context.type === 'privateAlbumMedia') {
      return mediaItems.find(item => item?.privateId === context.privateMediaId) || null
    }

    if (context.type === 'privateMedia') {
      return mediaItems.find(item => item?.privateId === context.privateMediaId) || null
    }

    if (context.type === 'media') {
      return findMediaByPublicId(context.mediaPublicId)
    }

    return null
  })

  return {
    album,
    media
  }
}