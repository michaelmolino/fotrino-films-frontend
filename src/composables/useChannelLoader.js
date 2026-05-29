import { computed, ref } from 'vue'
import { useQueryCache } from '@pinia/colada'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'
import { addHistory, addPrivateHistory, addPrivateAlbumHistory } from '@utils/history.js'
import { getCanonicalChannelRoutePath, getChannelRouteTarget } from '@utils/channelRoute.js'

// Shared loader state so the App-level loader and page-level loaders stay in sync.
const sharedChannel = ref(null)
const sharedReadModel = ref(null)
const sharedLoadStatus = ref('idle')
const sharedMetaData = ref(getMetaData(null, null))
const sharedLoadVersion = ref(0)
const sharedSortedAllMedia = computed(() => {
  if (!sharedChannel.value?.albums) return []
  return sharedChannel.value.albums.flatMap(album =>
    (album.media || []).map(media => ({ media, album }))
  )
})
const sharedAlbumsByPublicId = computed(() => {
  const map = {}
  for (const album of sharedChannel.value?.albums || []) {
    if (album?.publicId) {
      map[album.publicId] = album
    }
  }
  return map
})
const sharedMediaByPublicId = computed(() => {
  const map = {}
  for (const album of sharedChannel.value?.albums || []) {
    for (const media of album?.media || []) {
      if (media?.publicId) {
        map[media.publicId] = { ...media, albumPublicId: album.publicId }
      }
    }
  }
  return map
})
const sharedHydratedAlbumsByPublicId = computed(() => {
  const map = {}
  for (const album of sharedChannel.value?.albums || []) {
    if (album?.publicId) {
      map[album.publicId] = album
    }
  }
  const privateAlbum = sharedChannel.value?.album
  if (privateAlbum?.publicId && !map[privateAlbum.publicId]) {
    map[privateAlbum.publicId] = privateAlbum
  }
  return map
})

const EMPTY_CHANNEL_VIEW_RESPONSE = { data: null }
/**
 * Composable for loading and setting channel data based on route parameters
 * State is shared across composable callers so App-level route loading and
 * page-level rendering consume the same reactive data.
 * Can optionally manage page metadata updates
 * @param {Object} [options]
 * @param {boolean} [options.manageMeta=false] - Whether this instance should register and update page meta tags
 * @returns {Object} - Object with loadChannel method and metaData ref
 */
export function useChannelLoader({ manageMeta = false } = {}) {
  const channelStore = useChannelStore()
  const queryCache = useQueryCache()
  const route = useRoute()
  const router = useRouter()
  const channel = sharedChannel
  const readModel = sharedReadModel
  const loadStatus = sharedLoadStatus
  const sortedAllMedia = sharedSortedAllMedia
  const metaData = sharedMetaData
  const loadVersion = sharedLoadVersion
  const needsChannelData = computed(
    () =>
      !!(
        route.params?.channelPublicId ||
        route.params?.albumPublicId ||
        route.params?.mediaPublicId ||
        route.params?.privateAlbumId ||
        route.params?.privateMediaId
      )
  )
  const loading = computed(
    () => loadStatus.value === 'loading' || (loadStatus.value === 'idle' && needsChannelData.value)
  )

  const findAlbumByPublicId = albumPublicId => {
    if (!albumPublicId) return null
    return (
      sharedHydratedAlbumsByPublicId.value?.[albumPublicId] ||
      sharedAlbumsByPublicId.value?.[albumPublicId] ||
      null
    )
  }

  const findMediaByPublicId = mediaPublicId => {
    if (!mediaPublicId) return null
    return sharedMediaByPublicId.value?.[mediaPublicId] || null
  }

  const findAlbumByMediaPublicId = mediaPublicId => {
    const media = findMediaByPublicId(mediaPublicId)
    const albumPublicId = media?.albumPublicId
    return albumPublicId ? findAlbumByPublicId(albumPublicId) : null
  }

  const setChannelPayload = payload => {
    channel.value = payload?.data ?? null
    readModel.value = null
    return payload
  }

  const runRouteQuery = async options => {
    const entry = queryCache.ensure(options)
    const state = await queryCache.refresh(entry, options)
    if (state?.status === 'error') {
      throw state.error || new Error('Channel route query failed')
    }
    return state?.data ?? EMPTY_CHANNEL_VIEW_RESPONSE
  }

  const hasLoadedChannelRouteTarget = target => {
    if (!target || !channel.value) return false

    if (target.type === 'channel') {
      return channel.value.publicId === target.publicId
    }

    if (target.type === 'album') {
      return !!findAlbumByPublicId(target.publicId)
    }

    if (target.type === 'media') {
      return !!findMediaByPublicId(target.publicId)
    }

    if (target.type === 'privateMedia') {
      const media = channel.value?.album?.media || []
      return media.some(item => item?.privateId === target.privateMediaId)
    }

    if (target.type === 'privateAlbum') {
      return channel.value?.album?.privateId === target.privateAlbumId
    }

    if (target.type === 'privateAlbumMedia') {
      if (channel.value?.album?.privateId !== target.privateAlbumId) {
        return false
      }
      const mediaItems = channel.value?.album?.media
      if (!Array.isArray(mediaItems)) {
        return false
      }
      return mediaItems.some(item => item?.privateId === target.privateMediaId)
    }

    return false
  }

  // Only one owner should register meta updates to avoid conflicting page titles.
  if (manageMeta) {
    useMeta(() => metaData.value)
  }

  const fetchChannelByRoute = route => {
    const target = getChannelRouteTarget(route)
    if (!target) {
      return Promise.resolve(EMPTY_CHANNEL_VIEW_RESPONSE)
    }

    if (hasLoadedChannelRouteTarget(target)) {
      return Promise.resolve({
        data: channel.value
      })
    }

    if (target.type === 'channel') {
      return runRouteQuery(channelStore.channelQueryOptions(target.publicId))
    }
    if (target.type === 'album') {
      return runRouteQuery(channelStore.channelByAlbumQueryOptions(target.publicId))
    }
    if (target.type === 'media') {
      return runRouteQuery(channelStore.channelByMediaQueryOptions(target.publicId))
    }
    if (target.type === 'privateAlbum') {
      return runRouteQuery(channelStore.privateAlbumQueryOptions(target.privateAlbumId))
    }
    if (target.type === 'privateAlbumMedia') {
      return runRouteQuery(channelStore.privateAlbumQueryOptions(target.privateAlbumId, target.privateMediaId))
    }
    if (target.type === 'privateMedia') {
      return runRouteQuery(channelStore.privateMediaQueryOptions(target.privateMediaId))
    }
    return Promise.resolve(EMPTY_CHANNEL_VIEW_RESPONSE)
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

  const CANONICAL_PREFIX_BY_TYPE = {
    channel: '/c/',
    album: '/a/',
    media: '/m/',
    privateMedia: '/private/m/'
  }

  const getPathSegments = path => path.split('/').filter(Boolean)

  const isPrivateAlbumPath = path => {
    const segments = getPathSegments(path)
    return segments.length === 4 && segments[0] === 'private' && segments[1] === 'a'
  }

  const isPrivateAlbumMediaPath = path => {
    const segments = getPathSegments(path)
    return (
      segments.length === 6 &&
      segments[0] === 'private' &&
      segments[1] === 'a' &&
      segments[3] === 'm'
    )
  }

  const isCanonicalPathCompatibleWithTarget = (canonicalPath, target) => {
    if (!canonicalPath || !target?.type) return false

    if (target.type === 'privateAlbum') {
      return isPrivateAlbumPath(canonicalPath)
    }

    if (target.type === 'privateAlbumMedia') {
      return isPrivateAlbumMediaPath(canonicalPath)
    }

    const prefix = CANONICAL_PREFIX_BY_TYPE[target.type]
    return !!prefix && canonicalPath.startsWith(prefix)
  }

  const getCanonicalPathForTarget = (canonicalPath, target) => {
    if (!canonicalPath || !target?.type) return null

    if (typeof canonicalPath === 'string') {
      return canonicalPath
    }

    if (typeof canonicalPath !== 'object') {
      return null
    }

    if (target.type === 'privateAlbumMedia') {
      return canonicalPath.privateAlbumPath || canonicalPath.privatePath || null
    }

    if (target.type === 'privateAlbum' || target.type === 'privateMedia') {
      return canonicalPath.privatePath || null
    }

    return canonicalPath.publicPath || null
  }

  const syncCanonicalSlugs = route => {
    const target = getChannelRouteTarget(route)
    const hintedCanonicalPath = getCanonicalPathForTarget(channel.value?.canonicalPath, target)
    const fallbackCanonicalPath = getCanonicalChannelRoutePath(route, {
      channel: channel.value,
      findAlbumByPublicId,
      findMediaByPublicId,
      findAlbumByMediaPublicId
    })
    const canonicalPath = isCanonicalPathCompatibleWithTarget(hintedCanonicalPath, target)
      ? hintedCanonicalPath
      : fallbackCanonicalPath

    if (canonicalPath && canonicalPath !== route.path) {
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

    loadStatus.value = 'loading'

    try {
      const loaded = await fetchChannelByRoute(route)

      if (isStale()) {
        return null
      }

      channel.value = loaded.data
      readModel.value = null
      const loadedChannel = loaded.data

      syncChannelHistory(route, loadedChannel)
      syncPrivateHistory(route, loadedChannel)
      syncPrivateAlbumHistory(route, loadedChannel)
      syncCanonicalSlugs(route)

      metaData.value = getMetaData(route, loadedChannel)
      loadStatus.value = 'success'
      return loadedChannel
    } catch (error) {
      if (isStale()) {
        return null
      }

      setChannelPayload(null)
      loadStatus.value = 'error'
      metaData.value = getMetaData(null, null)
      console.error('Failed to load channel:', error)
      return null
    }
  }

  return {
    channel,
    readModel,
    sortedAllMedia,
    loadStatus,
    loading,
    findAlbumByPublicId,
    findMediaByPublicId,
    findAlbumByMediaPublicId,
    loadChannel,
    metaData
  }
}
