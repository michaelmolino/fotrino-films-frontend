import { computed, ref, toRef } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'
import { addHistory, addPrivateHistory, addPrivateAlbumHistory } from '@utils/history.js'
import {
  getCanonicalChannelRoutePath,
  hasLoadedChannelRouteTarget,
  getChannelRouteTarget
} from '@utils/channel-route.js'

/**
 * Composable for loading and setting channel data based on route parameters
 * Can optionally manage page metadata updates
 * @param {Object} [options]
 * @param {boolean} [options.manageMeta=false] - Whether this instance should register and update page meta tags
 * @returns {Object} - Object with loadChannel method and metaData ref
 */
export function useChannelLoader({ manageMeta = false } = {}) {
  const channelStore = useChannelStore()
  const route = useRoute()
  const router = useRouter()
  const channel = toRef(channelStore, 'channel')
  const readModel = toRef(channelStore, 'readModel')
  const sortedAllMedia = toRef(channelStore, 'sortedAllMedia')
  const loadStatus = toRef(channelStore, 'loadStatus')
  const metaData = ref(getMetaData(null, null))
  const loadVersion = ref(0)
  const needsChannelData = computed(
    () =>
      !!(
        route.params?.channelId ||
        route.params?.albumId ||
        route.params?.mediaId ||
        route.params?.privateAlbumId ||
        route.params?.privateMediaId
      )
  )
  const loading = computed(
    () => loadStatus.value === 'loading' || (loadStatus.value === 'idle' && needsChannelData.value)
  )

  // Only one owner should register meta updates to avoid conflicting page titles.
  if (manageMeta) {
    useMeta(() => metaData.value)
  }

  const fetchChannelByRoute = route => {
    const target = getChannelRouteTarget(route)
    if (!target) {
      return Promise.resolve(null)
    }

    if (target.type === 'channel') {
      return channelStore.loadChannel({ channelId: target.id })
    }
    if (target.type === 'album') {
      return channelStore.loadChannelByAlbum(target.id)
    }
    if (target.type === 'media') {
      return channelStore.loadChannelByMedia(target.id)
    }
    if (target.type === 'privateAlbum') {
      if (hasLoadedChannelRouteTarget(route, channelStore)) {
        return Promise.resolve(channelStore.channel)
      }
      return channelStore.loadPrivateAlbum({ privateAlbumId: target.albumId })
    }
    if (target.type === 'privateAlbumMedia') {
      if (hasLoadedChannelRouteTarget(route, channelStore)) {
        return Promise.resolve(channelStore.channel)
      }
      return channelStore.loadPrivateAlbum({
        privateAlbumId: target.albumId,
        privateMediaId: target.mediaId
      })
    }
    if (target.type === 'privateMedia') {
      if (hasLoadedChannelRouteTarget(route, channelStore)) {
        return Promise.resolve(channelStore.channel)
      }
      return channelStore.loadPrivateMedia(target.mediaId)
    }
    return Promise.resolve(null)
  }

  const syncPrivateHistory = (route, channel) => {
    // If this is a private-album route (with or without focused media),
    // the album is the top-level shared resource we track in history.
    if (!route.params?.privateMediaId || route.params?.privateAlbumId || !channel) return
    const media =
      (channel?.album?.media || []).find(item => item?.privateId === route.params.privateMediaId) ||
      null
    addPrivateHistory(route.params.privateMediaId, {
      title: media?.title || channel?.title || '',
      cover: media?.preview || channel?.cover || null,
      slug: media?.slug || route.params.mediaSlug || null
    })
  }

  const syncPrivateAlbumHistory = (route, channel) => {
    if (!route.params?.privateAlbumId || !channel?.album) return
    const album = channel.album
    addPrivateAlbumHistory(route.params.privateAlbumId, {
      title: album?.title || channel?.title || '',
      cover: album?.poster || channel?.cover || null,
      slug: album?.slug || route.params.albumSlug || null
    })
  }

  const syncChannelHistory = (route, channel) => {
    if (route.params?.privateMediaId || route.params?.privateAlbumId || !channel) return
    addHistory(channel)
  }

  const replacePath = (path, query) => {
    router.replace({ path, query })
  }

  const syncCanonicalSlugs = route => {
    const canonicalPath = getCanonicalChannelRoutePath(route, channelStore)
    if (canonicalPath) {
      replacePath(canonicalPath, route.query)
    }
  }

  /**
   * Load channel data from route params and update store/router/metadata
   * @param {Object} route - Vue Router route object
   * @returns {Promise<Object|null>} - Channel object or null
   */
  const loadChannel = async route => {
    const requestVersion = ++loadVersion.value
    const isStale = () => requestVersion !== loadVersion.value

    channelStore.setChannelLoadStatus('loading')

    try {
      await fetchChannelByRoute(route)
      const loadedChannel = channelStore.channel

      if (isStale()) {
        return null
      }

      syncChannelHistory(route, loadedChannel)
      syncPrivateHistory(route, loadedChannel)
      syncPrivateAlbumHistory(route, loadedChannel)
      syncCanonicalSlugs(route)

      metaData.value = getMetaData(route, loadedChannel, readModel.value)
      channelStore.setChannelLoadStatus('success')
      return loadedChannel
    } catch (error) {
      if (isStale()) {
        return null
      }

      channelStore.setChannel(null)
      channelStore.setChannelLoadStatus('error')
      metaData.value = getMetaData(null, null, null)
      console.error('Failed to load channel:', error)
      return null
    }
  }

  return {
    channel,
    sortedAllMedia,
    loadStatus,
    loading,
    loadChannel,
    metaData
  }
}
