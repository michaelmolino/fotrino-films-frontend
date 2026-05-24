export const getChannelRouteTarget = route => {
  if (route?.params?.privateAlbumId && route?.params?.privateMediaId) {
    return {
      type: 'privateAlbumMedia',
      albumId: route.params.privateAlbumId,
      mediaId: route.params.privateMediaId
    }
  }

  if (route?.params?.privateAlbumId) {
    return { type: 'privateAlbum', albumId: route.params.privateAlbumId }
  }

  if (route?.params?.channelId) {
    return { type: 'channel', id: route.params.channelId }
  }

  if (route?.params?.albumId) {
    return { type: 'album', id: route.params.albumId }
  }

  if (route?.params?.mediaId) {
    return { type: 'media', id: route.params.mediaId }
  }

  if (route?.params?.privateMediaId) {
    return { type: 'privateMedia', mediaId: route.params.privateMediaId }
  }

  return null
}

const getChannelCanonicalPath = (route, channelContext) => {
  const channel = channelContext.channel
  const channelId = channel?.publicId
  if (channelId && channel.slug && channel.slug !== route.params.channelSlug) {
    return `/c/${channelId}/${channel.slug}`
  }
  return null
}

const getAlbumCanonicalPath = (route, channelContext, target) => {
  const album = channelContext.findAlbumByPublicId(target.id)
  const albumId = album?.publicId
  if (albumId && album.slug && album.slug !== route.params.albumSlug) {
    return `/a/${albumId}/${album.slug}`
  }
  return null
}

const getMediaCanonicalPath = (route, channelContext, target) => {
  const media = channelContext.findMediaByPublicId(target.id)
  const mediaId = media?.publicId
  if (mediaId && media.slug && media.slug !== route.params.mediaSlug) {
    return `/m/${mediaId}/${media.slug}`
  }
  return null
}

const getPrivateMediaCanonicalPath = (route, channelContext) => {
  const mediaItems = channelContext.channel?.album?.media || []
  const media = mediaItems.find(item => item?.privateId === route.params.privateMediaId)
  if (media?.privateId && media?.slug && media.slug !== route.params.mediaSlug) {
    return `/private/m/${media.privateId}/${media.slug}`
  }
  return null
}

const getPrivateAlbumCanonicalPath = (route, channelContext) => {
  const album = channelContext.channel?.album
  const privateAlbumId = album?.privateId
  if (privateAlbumId && album.slug && album.slug !== route.params.albumSlug) {
    return `/private/a/${privateAlbumId}/${album.slug}`
  }
  return null
}

const getPrivateAlbumMediaCanonicalPath = (route, channelContext) => {
  const album = channelContext.channel?.album
  const privateAlbumId = album?.privateId
  const media = Array.isArray(album?.media)
    ? album.media.find(item => item?.privateId === route.params.privateMediaId)
    : null
  if (!privateAlbumId || !media?.privateId || !media?.slug) {
    return null
  }

  if (media.slug !== route.params.mediaSlug) {
    return `/private/a/${privateAlbumId}/m/${media.privateId}/${media.slug}`
  }

  return null
}

const CANONICAL_BUILDERS = {
  channel: getChannelCanonicalPath,
  album: getAlbumCanonicalPath,
  media: getMediaCanonicalPath,
  privateMedia: getPrivateMediaCanonicalPath,
  privateAlbum: getPrivateAlbumCanonicalPath,
  privateAlbumMedia: getPrivateAlbumMediaCanonicalPath
}

export const getCanonicalChannelRoutePath = (route, channelContext) => {
  const target = getChannelRouteTarget(route)
  if (!target) return null

  const builder = CANONICAL_BUILDERS[target.type]
  if (!builder) return null

  return builder(route, channelContext, target)
}
