export const buildChannelPath = ({ publicId, slug }) => {
  if (!publicId) return null
  return `/c/${publicId}/${slug}`
}

export const buildAlbumPath = ({ publicId, slug }) => {
  if (!publicId) return null
  return `/a/${publicId}/${slug}`
}

export const buildMediaPath = ({ publicId, slug }) => {
  if (!publicId) return null
  return `/m/${publicId}/${slug}`
}

export const buildPrivateAlbumPath = ({ privateId, slug }) => {
  if (!privateId) return null
  return `/private/a/${privateId}/${slug}`
}

export const buildPrivateMediaPath = ({ privateId, slug }) => {
  if (!privateId) return null
  return `/private/m/${privateId}/${slug}`
}

export const buildPrivateAlbumMediaPath = ({ privateAlbumId, privateMediaId, mediaSlug }) => {
  if (!privateAlbumId || !privateMediaId) return null
  return `/private/a/${privateAlbumId}/m/${privateMediaId}/${mediaSlug}`
}

const UNKNOWN_ROUTE_CONTEXT = {
  type: 'unknown',
  scope: null,
  isPrivate: false,
  privateScope: null
}

const PRIVATE_ALBUM_CONTEXT_TYPES = new Set(['privateAlbum', 'privateAlbumMedia'])

const getRouteParams = route => route?.params || {}

const getRouteBaseContext = route => {
  const params = getRouteParams(route)

  return {
    channelPublicId: null,
    albumPublicId: null,
    mediaPublicId: null,
    privateAlbumId: null,
    privateMediaId: null,
    channelSlug: params.channelSlug || null,
    albumSlug: params.albumSlug || null,
    mediaSlug: params.mediaSlug || null,
    hasAlbumTarget: false,
    hasMediaTarget: false
  }
}

const getAlbumMediaItems = album => (Array.isArray(album?.media) ? album.media : [])

const findPrivateMediaById = (album, privateMediaId) =>
  getAlbumMediaItems(album).find(item => item?.privateId === privateMediaId)

const buildCanonicalPathIfSlugChanged = ({ currentSlug, routeSlug, buildPath }) => {
  if (!currentSlug || currentSlug === routeSlug) return null
  return buildPath()
}

const normalizeCanonicalPath = canonicalPath => {
  if (typeof canonicalPath === 'string') {
    return {
      publicPath: canonicalPath,
      privatePath: canonicalPath,
      privateAlbumPath: canonicalPath
    }
  }

  return canonicalPath && typeof canonicalPath === 'object' ? canonicalPath : null
}

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
    getCanonicalPath: canonicalPath =>
      canonicalPath.privateAlbumPath || canonicalPath.privatePath || null,
    buildCanonicalPath: ({ route, channelContext }) => {
      const params = getRouteParams(route)
      const album = channelContext.channel?.album
      const privateAlbumId = album?.privateId
      const media = findPrivateMediaById(album, params.privateMediaId)

      if (!privateAlbumId || !media?.privateId || !media?.slug) {
        return null
      }

      return buildCanonicalPathIfSlugChanged({
        currentSlug: media.slug,
        routeSlug: params.mediaSlug,
        buildPath: () =>
          buildPrivateAlbumMediaPath({
            privateAlbumId,
            privateMediaId: media.privateId,
            mediaSlug: media.slug
          })
      })
    }
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
    getCanonicalPath: canonicalPath => canonicalPath.privatePath || null,
    buildCanonicalPath: ({ route, channelContext }) => {
      const params = getRouteParams(route)
      const album = channelContext.channel?.album
      const privateAlbumId = album?.privateId
      if (!privateAlbumId || !album?.slug) return null

      return buildCanonicalPathIfSlugChanged({
        currentSlug: album.slug,
        routeSlug: params.albumSlug,
        buildPath: () => buildPrivateAlbumPath({ privateId: privateAlbumId, slug: album.slug })
      })
    }
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
    getCanonicalPath: canonicalPath => canonicalPath.publicPath || null,
    buildCanonicalPath: ({ route, channelContext }) => {
      const params = getRouteParams(route)
      const channel = channelContext.channel
      const channelPublicId = channel?.publicId
      if (!channelPublicId || !channel?.slug) return null

      return buildCanonicalPathIfSlugChanged({
        currentSlug: channel.slug,
        routeSlug: params.channelSlug,
        buildPath: () => buildChannelPath({ publicId: channelPublicId, slug: channel.slug })
      })
    }
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
    getCanonicalPath: canonicalPath => canonicalPath.publicPath || null,
    buildCanonicalPath: ({ route, channelContext, target }) => {
      const params = getRouteParams(route)
      const album = channelContext.findAlbumByPublicId(target.publicId)
      const albumPublicId = album?.publicId
      if (!albumPublicId || !album?.slug) return null

      return buildCanonicalPathIfSlugChanged({
        currentSlug: album.slug,
        routeSlug: params.albumSlug,
        buildPath: () => buildAlbumPath({ publicId: albumPublicId, slug: album.slug })
      })
    }
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
    getCanonicalPath: canonicalPath => canonicalPath.publicPath || null,
    buildCanonicalPath: ({ route, channelContext, target }) => {
      const params = getRouteParams(route)
      const media = channelContext.findMediaByPublicId(target.publicId)
      const mediaPublicId = media?.publicId
      if (!mediaPublicId || !media?.slug) return null

      return buildCanonicalPathIfSlugChanged({
        currentSlug: media.slug,
        routeSlug: params.mediaSlug,
        buildPath: () => buildMediaPath({ publicId: mediaPublicId, slug: media.slug })
      })
    }
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
    getCanonicalPath: canonicalPath => canonicalPath.privatePath || null,
    buildCanonicalPath: ({ route, channelContext }) => {
      const params = getRouteParams(route)
      const media = findPrivateMediaById(channelContext.channel?.album, params.privateMediaId)
      if (!media?.privateId || !media?.slug) return null

      return buildCanonicalPathIfSlugChanged({
        currentSlug: media.slug,
        routeSlug: params.mediaSlug,
        buildPath: () => buildPrivateMediaPath({ privateId: media.privateId, slug: media.slug })
      })
    }
  }
}

const getRouteTypeDefinition = type => ROUTE_TYPE_DEFINITIONS[type] || null

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

  return getRouteTypeDefinition(context.type)?.getTargetFromContext(context) || null
}

export const isCanonicalPathCompatibleWithRouteTarget = (canonicalPath, target) => {
  if (!canonicalPath || !target?.type) return false

  const definition = getRouteTypeDefinition(target.type)
  return definition?.isCanonicalPathCompatible(canonicalPath) || false
}

export const getCanonicalPathForRouteTarget = (canonicalPath, target) => {
  if (!canonicalPath || !target?.type) return null

  const definition = getRouteTypeDefinition(target.type)
  const normalizedCanonicalPath = normalizeCanonicalPath(canonicalPath)

  return definition && normalizedCanonicalPath
    ? definition.getCanonicalPath(normalizedCanonicalPath)
    : null
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

  if (PRIVATE_ALBUM_CONTEXT_TYPES.has(context.type)) {
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

  if (PRIVATE_ALBUM_CONTEXT_TYPES.has(context.type)) {
    return buildPrivateAlbumPath({
      privateId: album.privateId,
      slug: album.slug
    })
  }

  return buildAlbumPath({ publicId: album.publicId, slug: album.slug })
}

export const getCanonicalChannelRoutePath = (route, channelContext) => {
  const target = getChannelRouteTarget(route)
  if (!target) return null

  return (
    getRouteTypeDefinition(target.type)?.buildCanonicalPath({
      route,
      channelContext,
      target
    }) || null
  )
}
