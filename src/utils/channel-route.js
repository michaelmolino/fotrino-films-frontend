export const getChannelRouteTarget = route => {
    if (route?.params?.privateProjectId && route?.params?.privateMediaId) {
        return {
            type: 'privateProjectMedia',
            projectId: route.params.privateProjectId,
            mediaId: route.params.privateMediaId,
        }
    }

    if (route?.params?.privateProjectId) {
        return { type: 'privateProject', projectId: route.params.privateProjectId }
    }

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
        return { type: 'privateMedia', mediaId: route.params.privateMediaId }
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
        const media = channelStore.channel?.project?.media
        if (Array.isArray(media)) {
            return media.some(item => item?.privateId === target.mediaId)
        }
        return media?.privateId === target.mediaId
    }

    if (target.type === 'privateProject') {
        return channelStore.channel?.project?.privateId === target.projectId
    }

    if (target.type === 'privateProjectMedia') {
        if (channelStore.channel?.project?.privateId !== target.projectId) {
            return false
        }
        const mediaItems = channelStore.channel?.project?.media
        if (!Array.isArray(mediaItems)) {
            return false
        }
        return mediaItems.some(item => item?.privateId === target.mediaId)
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
    const privateMediaId = Array.isArray(media) ? null : media?.privateId
    if (privateMediaId && media.slug && media.slug !== route.params.mediaSlug) {
        return `/private/m/${privateMediaId}/${media.slug}`
    }
    return null
}

const getPrivateProjectCanonicalPath = (route, channelStore) => {
    const project = channelStore.channel?.project
    const privateProjectId = project?.privateId
    if (privateProjectId && project.slug && project.slug !== route.params.projectSlug) {
        return `/private/p/${privateProjectId}/${project.slug}`
    }
    return null
}

const getPrivateProjectMediaCanonicalPath = (route, channelStore) => {
    const project = channelStore.channel?.project
    const privateProjectId = project?.privateId
    const media = Array.isArray(project?.media)
        ? project.media.find(item => item?.privateId === route.params.privateMediaId)
        : null
    if (!privateProjectId || !media?.privateId || !media?.slug) {
        return null
    }

    if (media.slug !== route.params.mediaSlug) {
        return `/private/p/${privateProjectId}/m/${media.privateId}/${media.slug}`
    }

    return null
}

const CANONICAL_BUILDERS = {
    channel: getChannelCanonicalPath,
    project: getProjectCanonicalPath,
    media: getMediaCanonicalPath,
    privateMedia: getPrivateMediaCanonicalPath,
    privateProject: getPrivateProjectCanonicalPath,
    privateProjectMedia: getPrivateProjectMediaCanonicalPath,
}

export const getCanonicalChannelRoutePath = (route, channelStore) => {
    const target = getChannelRouteTarget(route)
    if (!target) return null

    const builder = CANONICAL_BUILDERS[target.type]
    if (!builder) return null

    return builder(route, channelStore, target)
}