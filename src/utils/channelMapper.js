const buildMediaEntity = (media, albumPublicId) => ({
  id: media.publicId,
  publicId: media.publicId,
  privateId: media.privateId,
  album: albumPublicId,
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

const buildAlbumEntity = (album, channelPublicId, relationships, mediaByPublicId) => {
  const albumPublicId = album.publicId
  const mediaPublicIds = relationships.mediaPublicIdsByAlbumPublicId?.[albumPublicId] || []
  const media = mediaPublicIds
    .map(mediaPublicId => mediaByPublicId[mediaPublicId])
    .filter(Boolean)
    .map(item => buildMediaEntity(item, albumPublicId))

  return {
    id: albumPublicId,
    publicId: albumPublicId,
    privateId: album.privateId,
    channel: channelPublicId,
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

export const mapChannelReadModelToChannel = readModel => {
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
    id: channelEntity.publicId,
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
    .map(albumPublicId => albumsByPublicId[albumPublicId])
    .filter(Boolean)
    .map(album => buildAlbumEntity(album, channelEntity.publicId, relationships, mediaByPublicId))

  return {
    ...baseChannel,
    albums
  }
}
