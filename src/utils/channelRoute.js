export const getChannelRouteTarget = route => {
  if (route?.params?.privateAlbumId && route?.params?.privateMediaId) {
    return {
      type: 'privateAlbumMedia',
      privateAlbumId: route.params.privateAlbumId,
      privateMediaId: route.params.privateMediaId
    }
  }

  if (route?.params?.privateAlbumId) {
    return { type: 'privateAlbum', privateAlbumId: route.params.privateAlbumId }
  }

  if (route?.params?.channelPublicId) {
    return { type: 'channel', publicId: route.params.channelPublicId }
  }

  if (route?.params?.albumPublicId) {
    return { type: 'album', publicId: route.params.albumPublicId }
  }

  if (route?.params?.mediaPublicId) {
    return { type: 'media', publicId: route.params.mediaPublicId }
  }

  if (route?.params?.privateMediaId) {
    return { type: 'privateMedia', privateMediaId: route.params.privateMediaId }
  }

  return null
}

const getChannelCanonicalPath = (route, channelContext) => {
  const channel = channelContext.channel
  const channelPublicId = channel?.publicId
  if (channelPublicId && channel.slug && channel.slug !== route.params.channelSlug) {
    return `/c/${channelPublicId}/${channel.slug}`
  }
  return null
}

const getAlbumCanonicalPath = (route, channelContext, target) => {
  const album = channelContext.findAlbumByPublicId(target.publicId)
  const albumPublicId = album?.publicId
  if (albumPublicId && album.slug && album.slug !== route.params.albumSlug) {
    return `/a/${albumPublicId}/${album.slug}`
  }
  return null
}

const getMediaCanonicalPath = (route, channelContext, target) => {
  const media = channelContext.findMediaByPublicId(target.publicId)
  const mediaPublicId = media?.publicId
  if (mediaPublicId && media.slug && media.slug !== route.params.mediaSlug) {
    return `/m/${mediaPublicId}/${media.slug}`
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
