const timestampOrZero = value => {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

const sortByResourceDateDesc = items => {
  const list = Array.isArray(items) ? [...items] : []
  return list.sort((a, b) => timestampOrZero(b?.resourceDate) - timestampOrZero(a?.resourceDate))
}

const buildMediaEntity = (media, albumId, albumPublicId) => ({
  id: media.id,
  publicId: media.publicId,
  privateId: media.privateId,
  album: albumId,
  albumPublicId,
  title: media.title,
  slug: media.slug,
  descriptionUnsafe: media.descriptionUnsafe,
  preview: media.preview,
  src: media.src,
  type: media.type,
  orientation: media.orientation,
  main: media.main,
  resourceDate: media.resourceDate,
  pending: media.pending,
  deleted: media.deleted,
  created: media.created,
  updatedAt: media.updatedAt
})

const buildAlbumEntity = (album, channelId, relationships, mediaByPublicId) => {
  const albumPublicId = album.publicId
  const mediaPublicIds = relationships.mediaPublicIdsByAlbumPublicId?.[albumPublicId] || []
  const media = mediaPublicIds
    .map(mediaId => mediaByPublicId[mediaId])
    .filter(Boolean)
    .map(item => buildMediaEntity(item, album.id, albumPublicId))

  return {
    id: album.id,
    publicId: albumPublicId,
    privateId: album.privateId,
    channel: channelId,
    title: album.title,
    slug: album.slug,
    subtitle: album.subtitle,
    poster: album.poster,
    posterColor: album.posterColor,
    resourceDate: album.resourceDate,
    pending: album.pending,
    deleted: album.deleted,
    created: album.created,
    updatedAt: album.updatedAt,
    media
  }
}

export const sortChannelDetail = channel => {
  if (!channel) return channel
  const albums = sortByResourceDateDesc(channel.albums).map(album => ({
    ...album,
    media: sortByResourceDateDesc(album.media)
  }))
  return { ...channel, albums }
}

export const buildChannelFromReadModel = readModel => {
  if (!readModel) return null

  const focus = readModel.focus || {}
  const entities = readModel.entities || {}
  const relationships = readModel.relationships || {}
  const channelsByPublicId = entities.channelsByPublicId || {}
  const albumsByPublicId = entities.albumsByPublicId || {}
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
    created: channelEntity.created
  }

  const albumPublicIds = relationships.albumPublicIdsByChannelPublicId?.[channelPublicId] || []
  const albums = albumPublicIds
    .map(albumId => albumsByPublicId[albumId])
    .filter(Boolean)
    .map(album => buildAlbumEntity(album, channelEntity.id, relationships, mediaByPublicId))

  return sortChannelDetail({
    ...baseChannel,
    albums
  })
}
