import { addHistory, addPrivateAlbumHistory, addPrivateHistory } from '@utils/history.js'

function syncPrivateMediaHistory({ context, channel }) {
  if (context.type !== 'privateMedia' || !context.privateMediaId || !channel) return

  const media =
    (channel?.album?.media || []).find(item => item?.privateId === context.privateMediaId) || null

  addPrivateHistory(context.privateMediaId, {
    title: media?.title || channel?.title || '',
    cover: media?.preview || channel?.cover || null,
    slug: media?.slug || context.mediaSlug || null
  })
}

function syncPrivateAlbumHistory({ context, channel }) {
  if (!context.privateAlbumId || !channel?.album) return

  const album = channel.album
  addPrivateAlbumHistory(context.privateAlbumId, {
    title: album?.title || channel?.title || '',
    cover: album?.poster || channel?.cover || null,
    slug: album?.slug || context.albumSlug || null
  })
}

function syncPublicChannelHistory({ context, channel }) {
  if (context.isPrivate || !channel) return
  addHistory(channel)
}

export function syncChannelRouteHistory({ context, channel }) {
  syncPublicChannelHistory({ context, channel })
  syncPrivateMediaHistory({ context, channel })
  syncPrivateAlbumHistory({ context, channel })
}
