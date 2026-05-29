import { computed } from 'vue'
import { buildAlbumPath, buildMediaPath } from '@utils/channel-route.js'

export function useChannelRootViewModel({ loading, channel, route, selectedView, sortedAllMedia }) {
  const albums = computed(() => {
    if (loading.value || !channel.value) return []
    return channel.value.albums || []
  })

  const contentState = computed(() => {
    if (loading.value) return 'loading'
    return channel.value?.publicId === route.params.channelPublicId ? 'ready' : 'not-found'
  })

  const showAlbumsView = computed(() => selectedView.value === 'albums')

  const albumCards = computed(() => {
    return albums.value
      .filter(album => !!album?.privateId)
      .map(album => ({
        id: album.privateId,
        album,
        to: buildAlbumPath({ publicId: album.publicId, slug: album.slug })
      }))
  })

  const mediaCards = computed(() => {
    return sortedAllMedia.value
      .filter(item => !!item?.media?.privateId)
      .map((item, index) => ({
        id: item.media.privateId,
        album: item.album,
        media: item.media,
        to: buildMediaPath({ publicId: item.media.publicId, slug: item.media.slug }),
        priority: index === 0 ? 'high' : 'auto'
      }))
  })

  const showEmptyContent = computed(() => {
    return showAlbumsView.value ? albumCards.value.length === 0 : mediaCards.value.length === 0
  })

  const albumCount = computed(() => albums.value.length)
  const allCount = computed(() => sortedAllMedia.value.length)

  return {
    albums,
    contentState,
    showAlbumsView,
    albumCards,
    mediaCards,
    showEmptyContent,
    albumCount,
    allCount
  }
}
