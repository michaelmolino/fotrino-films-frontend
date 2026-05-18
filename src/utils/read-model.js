import { sortBy } from '@utils/sort.js'

const buildMediaEntity = (media, projectId) => ({
    id: media.id,
    publicId: media.publicId,
    privateId: media.privateId,
    project: projectId,
    title: media.title,
    slug: media.slug,
    descriptionUnsafe: media.descriptionUnsafe,
    preview: media.preview,
    src: media.src,
    type: media.type,
    main: media.main,
    resourceDate: media.resourceDate,
    pending: media.pending,
    deleted: media.deleted,
    created: media.created,
    updatedAt: media.updatedAt,
})

const buildProjectEntity = (project, channelId, relationships, mediaByPublicId) => {
    const projectPublicId = project.publicId
    const mediaPublicIds = relationships.mediaPublicIdsByProjectPublicId?.[projectPublicId] || []
    const media = mediaPublicIds
        .map(mediaId => mediaByPublicId[mediaId])
        .filter(Boolean)
        .map(item => buildMediaEntity(item, project.id))

    return {
        id: project.id,
        publicId: projectPublicId,
        channel: channelId,
        title: project.title,
        slug: project.slug,
        subtitle: project.subtitle,
        poster: project.poster,
        posterColor: project.posterColor,
        resourceDate: project.resourceDate,
        pending: project.pending,
        deleted: project.deleted,
        created: project.created,
        updatedAt: project.updatedAt,
        media,
    }
}

export const sortChannelDetail = channel => {
    if (!channel) return channel
    const projects = sortBy(channel.projects, 'resourceDate', 'desc').map(project => ({
        ...project,
        media: sortBy(project.media, 'resourceDate', 'desc')
    }))
    return { ...channel, projects }
}

export const buildChannelFromReadModel = readModel => {
    if (!readModel) return null

    const focus = readModel.focus || {}
    const entities = readModel.entities || {}
    const relationships = readModel.relationships || {}
    const channelsByPublicId = entities.channelsByPublicId || {}
    const projectsByPublicId = entities.projectsByPublicId || {}
    const mediaByPublicId = entities.mediaByPublicId || {}

    const channelPublicId = focus.channelPublicId
    if (!channelPublicId) return null

    const channelEntity = channelsByPublicId[channelPublicId]
    if (!channelEntity) return null

    const baseChannel = {
        id: channelEntity.id,
        publicId: channelEntity.publicId,
        title: channelEntity.title,
        slug: channelEntity.slug,
        cover: channelEntity.cover,
        ownerName: channelEntity.ownerName,
        pending: channelEntity.pending,
        deleted: channelEntity.deleted,
        created: channelEntity.created,
    }

    const projectPublicIds = relationships.projectPublicIdsByChannelPublicId?.[channelPublicId] || []
    const projects = projectPublicIds
        .map(projectId => projectsByPublicId[projectId])
        .filter(Boolean)
        .map(project => buildProjectEntity(project, channelEntity.id, relationships, mediaByPublicId))

    return sortChannelDetail({
        ...baseChannel,
        projects,
    })
}

export const normalizeChannelPayload = payload => {
    if (!payload) return { channel: payload, readModel: null }

    const hasReadModelEnvelope = !!(payload?.focus && payload?.entities && payload?.relationships)
    if (!hasReadModelEnvelope) {
        // Backward compatibility: some endpoints still return a plain channel payload.
        // Normalize sorting when projects are present and continue without a read model.
        if (Array.isArray(payload?.projects)) {
            return {
                channel: sortChannelDetail(payload),
                readModel: null,
            }
        }

        // Private media payloads are intentionally non-envelope responses.
        return {
            channel: payload,
            readModel: null,
        }
    }

    return {
        channel: buildChannelFromReadModel(payload),
        readModel: payload,
    }
}