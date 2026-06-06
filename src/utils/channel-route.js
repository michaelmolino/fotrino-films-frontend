const UNKNOWN_ROUTE_CONTEXT = {
  type: 'unknown',
  scope: null,
  isPrivate: false,
  privateScope: null
}

const getRouteParams = route => route?.params || {}

const getRouteBaseContext = route => {
  const params = getRouteParams(route)

  return {
    channelPublicId: null,
    albumPublicId: null,
    mediaPublicId: null,
    privateAlbumId: null,
    privateMediaId: null,
    channelSlug: params.channelSlug,
    albumSlug: params.albumSlug,
    mediaSlug: params.mediaSlug,
    hasAlbumTarget: false,
    hasMediaTarget: false
  }
}

const getAlbumMediaItems = album => (Array.isArray(album?.media) ? album.media : [])

const getPathSegments = path => path.split('/').filter(Boolean)

const isPrivateAlbumPath = path => {
  const segments = getPathSegments(path)
  return segments.length === 4 && segments[0] === 'private' && segments[1] === 'a'
}

const isPrivateAlbumMediaPath = path => {
  const segments = getPathSegments(path)
  return (
    segments.length === 6 && segments[0] === 'private' && segments[1] === 'a' && segments[3] === 'm'
  )
}

const ROUTE_TARGET_PRIORITY = [
  'privateAlbumMedia',
  'privateAlbum',
  'channel',
  'album',
  'media',
  'privateMedia'
]

const ROUTE_TYPE_DEFINITIONS = {
  privateAlbumMedia: {
    getTargetFromParams: params => {
      if (!params.privateAlbumId || !params.privateMediaId) return null

      return {
        type: 'privateAlbumMedia',
        privateAlbumId: params.privateAlbumId,
        privateMediaId: params.privateMediaId
      }
    },
    getContext: target => ({
      type: 'privateAlbumMedia',
      scope: 'media',
      isPrivate: true,
      privateScope: 'album',
      privateAlbumId: target.privateAlbumId,
      privateMediaId: target.privateMediaId,
      hasAlbumTarget: true,
      hasMediaTarget: true
    }),
    getTargetFromContext: context => {
      if (context.type !== 'privateAlbumMedia') return null

      return {
        type: 'privateAlbumMedia',
        privateAlbumId: context.privateAlbumId,
        privateMediaId: context.privateMediaId
      }
    },
    isLoaded: ({ target, channel }) => {
      const album = channel?.album
      if (album?.privateId !== target.privateAlbumId) {
        return false
      }

      return getAlbumMediaItems(album).some(item => item?.privateId === target.privateMediaId)
    },
    isCanonicalPathCompatible: isPrivateAlbumMediaPath,
    getCanonicalPath: canonicalPath => canonicalPath.privateAlbumPath || canonicalPath.privatePath
  },
  privateAlbum: {
    getTargetFromParams: params => {
      if (!params.privateAlbumId) return null
      return { type: 'privateAlbum', privateAlbumId: params.privateAlbumId }
    },
    getContext: target => ({
      type: 'privateAlbum',
      scope: 'album',
      isPrivate: true,
      privateScope: 'album',
      privateAlbumId: target.privateAlbumId,
      hasAlbumTarget: true
    }),
    getTargetFromContext: context => {
      if (context.type !== 'privateAlbum') return null
      return { type: 'privateAlbum', privateAlbumId: context.privateAlbumId }
    },
    isLoaded: ({ target, channel }) => channel?.album?.privateId === target.privateAlbumId,
    isCanonicalPathCompatible: isPrivateAlbumPath,
    getCanonicalPath: canonicalPath => canonicalPath.privatePath
  },
  channel: {
    getTargetFromParams: params => {
      if (!params.channelPublicId) return null
      return { type: 'channel', publicId: params.channelPublicId }
    },
    getContext: target => ({
      type: 'channel',
      scope: 'channel',
      isPrivate: false,
      privateScope: null,
      channelPublicId: target.publicId
    }),
    getTargetFromContext: context => {
      if (context.type !== 'channel') return null
      return { type: 'channel', publicId: context.channelPublicId }
    },
    isLoaded: ({ target, channel }) => channel?.publicId === target.publicId,
    isCanonicalPathCompatible: canonicalPath => canonicalPath.startsWith('/c/'),
    getCanonicalPath: canonicalPath => canonicalPath.publicPath
  },
  album: {
    getTargetFromParams: params => {
      if (!params.albumPublicId) return null
      return { type: 'album', publicId: params.albumPublicId }
    },
    getContext: target => ({
      type: 'album',
      scope: 'album',
      isPrivate: false,
      privateScope: null,
      albumPublicId: target.publicId,
      hasAlbumTarget: true
    }),
    getTargetFromContext: context => {
      if (context.type !== 'album') return null
      return { type: 'album', publicId: context.albumPublicId }
    },
    isLoaded: ({ target, findAlbumByPublicId }) => !!findAlbumByPublicId(target.publicId),
    isCanonicalPathCompatible: canonicalPath => canonicalPath.startsWith('/a/'),
    getCanonicalPath: canonicalPath => canonicalPath.publicPath
  },
  media: {
    getTargetFromParams: params => {
      if (!params.mediaPublicId) return null
      return { type: 'media', publicId: params.mediaPublicId }
    },
    getContext: target => ({
      type: 'media',
      scope: 'media',
      isPrivate: false,
      privateScope: null,
      mediaPublicId: target.publicId,
      hasMediaTarget: true
    }),
    getTargetFromContext: context => {
      if (context.type !== 'media') return null
      return { type: 'media', publicId: context.mediaPublicId }
    },
    isLoaded: ({ target, findMediaByPublicId }) => !!findMediaByPublicId(target.publicId),
    isCanonicalPathCompatible: canonicalPath => canonicalPath.startsWith('/m/'),
    getCanonicalPath: canonicalPath => canonicalPath.publicPath
  },
  privateMedia: {
    getTargetFromParams: params => {
      if (!params.privateMediaId) return null
      return { type: 'privateMedia', privateMediaId: params.privateMediaId }
    },
    getContext: target => ({
      type: 'privateMedia',
      scope: 'media',
      isPrivate: true,
      privateScope: 'media',
      privateMediaId: target.privateMediaId,
      hasMediaTarget: true
    }),
    getTargetFromContext: context => {
      if (context.type !== 'privateMedia') return null
      return { type: 'privateMedia', privateMediaId: context.privateMediaId }
    },
    isLoaded: ({ target, channel }) =>
      getAlbumMediaItems(channel?.album).some(item => item?.privateId === target.privateMediaId),
    isCanonicalPathCompatible: canonicalPath => canonicalPath.startsWith('/private/m/'),
    getCanonicalPath: canonicalPath => canonicalPath.privatePath
  }
}

const getRouteTypeDefinition = type => ROUTE_TYPE_DEFINITIONS[type]

export const getChannelRouteTarget = route => {
  const params = getRouteParams(route)

  for (const type of ROUTE_TARGET_PRIORITY) {
    const target = getRouteTypeDefinition(type)?.getTargetFromParams(params)
    if (target) {
      return target
    }
  }

  return null
}

export const resolveChannelRouteContext = route => {
  const baseContext = getRouteBaseContext(route)
  const target = getChannelRouteTarget(route)

  if (!target) {
    return {
      ...UNKNOWN_ROUTE_CONTEXT,
      ...baseContext
    }
  }

  const definition = getRouteTypeDefinition(target.type)
  if (!definition) {
    return {
      ...UNKNOWN_ROUTE_CONTEXT,
      ...baseContext
    }
  }

  return {
    ...baseContext,
    ...definition.getContext(target)
  }
}

export const isChannelRouteTargetLoaded = ({
  target,
  channel,
  findAlbumByPublicId,
  findMediaByPublicId
}) => {
  if (!target || !channel) return false

  const definition = getRouteTypeDefinition(target.type)
  return (
    definition?.isLoaded({
      target,
      channel,
      findAlbumByPublicId,
      findMediaByPublicId
    }) || false
  )
}

export const toChannelRouteTargetFromContext = context => {
  if (!context || context.type === 'unknown') return null

  return getRouteTypeDefinition(context.type)?.getTargetFromContext(context)
}

export const isCanonicalPathCompatibleWithRouteTarget = (canonicalPath, target) => {
  if (!canonicalPath || !target?.type) return false

  const definition = getRouteTypeDefinition(target.type)
  return definition?.isCanonicalPathCompatible(canonicalPath) || false
}

export const getCanonicalPathForRouteTarget = (canonicalPath, target) => {
  if (!canonicalPath || !target?.type) return null

  const definition = getRouteTypeDefinition(target.type)
  return definition ? definition.getCanonicalPath(canonicalPath) : null
}

export const resolveCanonicalPathForRoute = ({ context, canonicalPath }) => {
  const target = toChannelRouteTargetFromContext(context)
  const hintedCanonicalPath = getCanonicalPathForRouteTarget(canonicalPath, target)

  return isCanonicalPathCompatibleWithRouteTarget(hintedCanonicalPath, target)
    ? hintedCanonicalPath
    : null
}

export const resolveMediaCanonicalPathForContext = ({ context, canonicalPath }) => {
  if (!context || !canonicalPath) return null

  if (context.type === 'privateAlbum' || context.type === 'privateAlbumMedia') {
    return canonicalPath.privateAlbumPath
  }

  if (context.type === 'privateMedia') {
    return canonicalPath.privatePath
  }

  return canonicalPath.publicPath
}

export const resolveAlbumCanonicalPathForContext = ({ context, canonicalPath }) => {
  if (!context || !canonicalPath) return null

  if (context.type === 'privateAlbum' || context.type === 'privateAlbumMedia') {
    return canonicalPath.privatePath
  }

  return canonicalPath.publicPath
}
