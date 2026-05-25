import { computed } from 'vue'

export function useChannelRootViewModel({ loading, channel, route, selectedView, sortedAllMedia }) {
  const albums = computed(() => {
    if (loading.value || !channel.value) return []
    return channel.value.albums || []
  })

  const contentState = computed(() => {
    if (loading.value) return 'loading'
    return channel.value?.publicId === route.params.channelId ? 'ready' : 'not-found'
  })

  const showAlbumsView = computed(() => selectedView.value === 'albums')

  const albumCards = computed(() => {
    return albums.value.map(album => ({
      id: album.id,
      album,
      to: `/a/${album.publicId}/${album.slug}`
    }))
  })

  const mediaCards = computed(() => {
    return sortedAllMedia.value.map((item, index) => ({
      id: item.media.id,
      album: item.album,
      media: item.media,
      to: `/m/${item.media.publicId}/${item.media.slug}`,
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
