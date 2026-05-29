function hasIdAndSlug(id, slug) {
  return Boolean(id && slug)
}

export const buildChannelPath = ({ publicId, slug }) => {
  if (!hasIdAndSlug(publicId, slug)) return null
  return `/c/${publicId}/${slug}`
}

export const buildAlbumPath = ({ publicId, slug }) => {
  if (!hasIdAndSlug(publicId, slug)) return null
  return `/a/${publicId}/${slug}`
}

export const buildMediaPath = ({ publicId, slug }) => {
  if (!hasIdAndSlug(publicId, slug)) return null
  return `/m/${publicId}/${slug}`
}

export const buildPrivateAlbumPath = ({ privateId, slug }) => {
  if (!hasIdAndSlug(privateId, slug)) return null
  return `/private/a/${privateId}/${slug}`
}

export const buildPrivateMediaPath = ({ privateId, slug }) => {
  if (!hasIdAndSlug(privateId, slug)) return null
  return `/private/m/${privateId}/${slug}`
}

export const buildPrivateAlbumMediaPath = ({ privateAlbumId, privateMediaId, mediaSlug }) => {
  if (!hasIdAndSlug(privateAlbumId, mediaSlug) || !privateMediaId) return null
  return `/private/a/${privateAlbumId}/m/${privateMediaId}/${mediaSlug}`
}

export const buildHistoryTargetPath = entry => {
  if (!entry?.resourceId || !entry?.slug) return null

  if (entry.type === 'privateAlbum') {
    return buildPrivateAlbumPath({ privateId: entry.resourceId, slug: entry.slug })
  }
  if (entry.type === 'privateMedia') {
    return buildPrivateMediaPath({ privateId: entry.resourceId, slug: entry.slug })
  }
  return buildChannelPath({ publicId: entry.resourceId, slug: entry.slug })
}

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
    return buildChannelPath({ publicId: channelPublicId, slug: channel.slug })
  }
  return null
}

const getAlbumCanonicalPath = (route, channelContext, target) => {
  const album = channelContext.findAlbumByPublicId(target.publicId)
  const albumPublicId = album?.publicId
  if (albumPublicId && album.slug && album.slug !== route.params.albumSlug) {
    return buildAlbumPath({ publicId: albumPublicId, slug: album.slug })
  }
  return null
}

const getMediaCanonicalPath = (route, channelContext, target) => {
  const media = channelContext.findMediaByPublicId(target.publicId)
  const mediaPublicId = media?.publicId
  if (mediaPublicId && media.slug && media.slug !== route.params.mediaSlug) {
    return buildMediaPath({ publicId: mediaPublicId, slug: media.slug })
  }
  return null
}

const getPrivateMediaCanonicalPath = (route, channelContext) => {
  const mediaItems = channelContext.channel?.album?.media || []
  const media = mediaItems.find(item => item?.privateId === route.params.privateMediaId)
  if (media?.privateId && media?.slug && media.slug !== route.params.mediaSlug) {
    return buildPrivateMediaPath({ privateId: media.privateId, slug: media.slug })
  }
  return null
}

const getPrivateAlbumCanonicalPath = (route, channelContext) => {
  const album = channelContext.channel?.album
  const privateAlbumId = album?.privateId
  if (privateAlbumId && album.slug && album.slug !== route.params.albumSlug) {
    return buildPrivateAlbumPath({ privateId: privateAlbumId, slug: album.slug })
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
    return buildPrivateAlbumMediaPath({
      privateAlbumId,
      privateMediaId: media.privateId,
      mediaSlug: media.slug
    })
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
