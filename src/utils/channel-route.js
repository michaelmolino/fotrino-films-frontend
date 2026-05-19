export const getChannelRouteTarget = route => {
    if (route?.params?.channelId) {
        return { type: 'channel', id: route.params.channelId }
    }

    if (route?.params?.projectId) {
        return { type: 'project', id: route.params.projectId }
    }

    if (route?.params?.mediaId) {
        return { type: 'media', id: route.params.mediaId }
    }

    if (route?.params?.privateMediaId) {
        return { type: 'privateMedia', id: route.params.privateMediaId }
    }

    return null
}

export const hasLoadedChannelRouteTarget = (route, channelStore) => {
    const target = getChannelRouteTarget(route)
    if (!target) return false

    if (target.type === 'channel') {
        return channelStore.channel?.publicId === target.id
    }

    if (target.type === 'project') {
        return !!channelStore.findProjectByPublicId(target.id)
    }

    if (target.type === 'media') {
        return !!channelStore.findMediaByPublicId(target.id)
    }

    if (target.type === 'privateMedia') {
        return channelStore.channel?.project?.media?.privateId === target.id
    }

    return false
}

const getChannelCanonicalPath = (route, channelStore) => {
    const channel = channelStore.channel
    const channelId = channel?.publicId
    if (channelId && channel.slug && channel.slug !== route.params.channelSlug) {
        return `/c/${channelId}/${channel.slug}`
    }
    return null
}

const getProjectCanonicalPath = (route, channelStore, target) => {
    const project = channelStore.findProjectByPublicId(target.id)
    const projectId = project?.publicId
    if (projectId && project.slug && project.slug !== route.params.projectSlug) {
        return `/p/${projectId}/${project.slug}`
    }
    return null
}

const getMediaCanonicalPath = (route, channelStore, target) => {
    const media = channelStore.findMediaByPublicId(target.id)
    const mediaId = media?.publicId
    if (mediaId && media.slug && media.slug !== route.params.mediaSlug) {
        return `/m/${mediaId}/${media.slug}`
    }
    return null
}

const getPrivateMediaCanonicalPath = (route, channelStore) => {
    const media = channelStore.channel?.project?.media
    const privateMediaId = media?.privateId
    if (privateMediaId && media.slug && media.slug !== route.params.mediaSlug) {
        return `/private/m/${privateMediaId}/${media.slug}`
    }
    return null
}

const CANONICAL_BUILDERS = {
    channel: getChannelCanonicalPath,
    project: getProjectCanonicalPath,
    media: getMediaCanonicalPath,
    privateMedia: getPrivateMediaCanonicalPath,
}

export const getCanonicalChannelRoutePath = (route, channelStore) => {
    const target = getChannelRouteTarget(route)
    if (!target) return null

    const builder = CANONICAL_BUILDERS[target.type]
    if (!builder) return null

    return builder(route, channelStore, target)
}