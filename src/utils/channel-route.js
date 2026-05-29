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

export const resolveChannelRouteContext = route => {
  const channelSlug = route?.params?.channelSlug || null
  const albumSlug = route?.params?.albumSlug || null
  const mediaSlug = route?.params?.mediaSlug || null
  const target = getChannelRouteTarget(route)

  const baseContext = {
    channelPublicId: null,
    albumPublicId: null,
    mediaPublicId: null,
    privateAlbumId: null,
    privateMediaId: null,
    channelSlug,
    albumSlug,
    mediaSlug,
    hasAlbumTarget: false,
    hasMediaTarget: false
  }

  if (!target) {
    return {
      type: 'unknown',
      scope: null,
      isPrivate: false,
      privateScope: null,
      ...baseContext
    }
  }

  const contextByType = {
    channel: {
      type: 'channel',
      scope: 'channel',
      isPrivate: false,
      privateScope: null,
      channelPublicId: target.publicId
    },
    album: {
      type: 'album',
      scope: 'album',
      isPrivate: false,
      privateScope: null,
      albumPublicId: target.publicId,
      hasAlbumTarget: true
    },
    media: {
      type: 'media',
      scope: 'media',
      isPrivate: false,
      privateScope: null,
      mediaPublicId: target.publicId,
      hasMediaTarget: true
    },
    privateAlbum: {
      type: 'privateAlbum',
      scope: 'album',
      isPrivate: true,
      privateScope: 'album',
      privateAlbumId: target.privateAlbumId,
      hasAlbumTarget: true
    },
    privateAlbumMedia: {
      type: 'privateAlbumMedia',
      scope: 'media',
      isPrivate: true,
      privateScope: 'album',
      privateAlbumId: target.privateAlbumId,
      privateMediaId: target.privateMediaId,
      hasAlbumTarget: true,
      hasMediaTarget: true
    },
    privateMedia: {
      type: 'privateMedia',
      scope: 'media',
      isPrivate: true,
      privateScope: 'media',
      privateMediaId: target.privateMediaId,
      hasMediaTarget: true
    }
  }

  return {
    ...baseContext,
    ...(contextByType[target.type] || contextByType.privateMedia)
  }
}

export const isChannelRouteTargetLoaded = ({
  target,
  channel,
  findAlbumByPublicId,
  findMediaByPublicId
}) => {
  if (!target || !channel) return false

  const matchers = {
    channel: () => channel.publicId === target.publicId,
    album: () => !!findAlbumByPublicId(target.publicId),
    media: () => !!findMediaByPublicId(target.publicId),
    privateMedia: () => {
      const media = channel?.album?.media || []
      return media.some(item => item?.privateId === target.privateMediaId)
    },
    privateAlbum: () => channel?.album?.privateId === target.privateAlbumId,
    privateAlbumMedia: () => {
      if (channel?.album?.privateId !== target.privateAlbumId) {
        return false
      }
      const mediaItems = channel?.album?.media
      if (!Array.isArray(mediaItems)) {
        return false
      }
      return mediaItems.some(item => item?.privateId === target.privateMediaId)
    }
  }

  const matcher = matchers[target.type]
  return matcher ? matcher() : false
}

export const toChannelRouteTargetFromContext = context => {
  if (!context || context.type === 'unknown') return null

  if (context.type === 'channel') {
    return { type: 'channel', publicId: context.channelPublicId }
  }

  if (context.type === 'album') {
    return { type: 'album', publicId: context.albumPublicId }
  }

  if (context.type === 'media') {
    return { type: 'media', publicId: context.mediaPublicId }
  }

  if (context.type === 'privateAlbum') {
    return { type: 'privateAlbum', privateAlbumId: context.privateAlbumId }
  }

  if (context.type === 'privateAlbumMedia') {
    return {
      type: 'privateAlbumMedia',
      privateAlbumId: context.privateAlbumId,
      privateMediaId: context.privateMediaId
    }
  }

  return { type: 'privateMedia', privateMediaId: context.privateMediaId }
}

const CANONICAL_PREFIX_BY_TYPE = {
  channel: '/c/',
  album: '/a/',
  media: '/m/',
  privateMedia: '/private/m/'
}

const getPathSegments = path => path.split('/').filter(Boolean)

const isPrivateAlbumPath = path => {
  const segments = getPathSegments(path)
  return segments.length === 4 && segments[0] === 'private' && segments[1] === 'a'
}

const isPrivateAlbumMediaPath = path => {
  const segments = getPathSegments(path)
  return (
    segments.length === 6 &&
    segments[0] === 'private' &&
    segments[1] === 'a' &&
    segments[3] === 'm'
  )
}

export const isCanonicalPathCompatibleWithRouteTarget = (canonicalPath, target) => {
  if (!canonicalPath || !target?.type) return false

  if (target.type === 'privateAlbum') {
    return isPrivateAlbumPath(canonicalPath)
  }

  if (target.type === 'privateAlbumMedia') {
    return isPrivateAlbumMediaPath(canonicalPath)
  }

  const prefix = CANONICAL_PREFIX_BY_TYPE[target.type]
  return !!prefix && canonicalPath.startsWith(prefix)
}

export const getCanonicalPathForRouteTarget = (canonicalPath, target) => {
  if (!canonicalPath || !target?.type) return null

  if (typeof canonicalPath === 'string') {
    return canonicalPath
  }

  if (typeof canonicalPath !== 'object') {
    return null
  }

  if (target.type === 'privateAlbumMedia') {
    return canonicalPath.privateAlbumPath || canonicalPath.privatePath || null
  }

  if (target.type === 'privateAlbum' || target.type === 'privateMedia') {
    return canonicalPath.privatePath || null
  }

  return canonicalPath.publicPath || null
}

export const resolveCanonicalPathForRoute = ({ route, context, canonicalPath, channelContext }) => {
  const target = toChannelRouteTargetFromContext(context)
  const hintedCanonicalPath = getCanonicalPathForRouteTarget(canonicalPath, target)
  const fallbackCanonicalPath = getCanonicalChannelRoutePath(route, channelContext)

  return isCanonicalPathCompatibleWithRouteTarget(hintedCanonicalPath, target)
    ? hintedCanonicalPath
    : fallbackCanonicalPath
}

export const buildMediaPathForRouteContext = ({ context, media, album = null }) => {
  if (!context || !media) return null

  if (context.type === 'privateAlbum' || context.type === 'privateAlbumMedia') {
    const privateAlbumId = context.privateAlbumId || album?.privateId
    return buildPrivateAlbumMediaPath({
      privateAlbumId,
      privateMediaId: media.privateId,
      mediaSlug: media.slug
    })
  }

  if (context.type === 'privateMedia') {
    return buildPrivateMediaPath({
      privateId: media.privateId,
      slug: media.slug
    })
  }

  return buildMediaPath({ publicId: media.publicId, slug: media.slug })
}

export const buildAlbumPathForRouteContext = ({ context, album }) => {
  if (!context || !album) return null

  if (context.type === 'privateAlbum' || context.type === 'privateAlbumMedia') {
    return buildPrivateAlbumPath({
      privateId: album.privateId,
      slug: album.slug
    })
  }

  return buildAlbumPath({ publicId: album.publicId, slug: album.slug })
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
