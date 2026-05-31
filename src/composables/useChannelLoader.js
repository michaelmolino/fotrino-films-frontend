import { computed, ref } from 'vue'
import { useQueryCache } from '@pinia/colada'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'
import { syncChannelRouteHistory } from '@utils/history.js'
import {
  isChannelRouteTargetLoaded,
  resolveCanonicalPathForRoute,
  resolveChannelRouteContext,
  toChannelRouteTargetFromContext
} from '@utils/channel-route.js'

// Shared loader state so the App-level loader and page-level loaders stay in sync.
const sharedChannel = ref(null)
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
// Shared route loader for channel/album/media data. Can optionally own meta updates.
export function useChannelLoader({ manageMeta = false } = {}) {
  const channelStore = useChannelStore()
  const queryCache = useQueryCache()
  const route = useRoute()
  const router = useRouter()
  const channel = sharedChannel
  const loadStatus = sharedLoadStatus
  const sortedAllMedia = sharedSortedAllMedia
  const metaData = sharedMetaData
  const loadVersion = sharedLoadVersion
  const routeContext = computed(() => resolveChannelRouteContext(route))
  const needsChannelData = computed(() => routeContext.value.type !== 'unknown')
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

  const runRouteQuery = async options => {
    const entry = queryCache.ensure(options)
    const state = await queryCache.refresh(entry, options)
    if (state?.status === 'error') {
      throw state.error || new Error('Channel route query failed')
    }
    return state?.data ?? EMPTY_CHANNEL_VIEW_RESPONSE
  }

  // Only one owner should register meta updates to avoid conflicting page titles.
  if (manageMeta) {
    useMeta(() => metaData.value)
  }

  const fetchChannelByRouteContext = context => {
    const target = toChannelRouteTargetFromContext(context)
    if (!target) {
      return Promise.resolve(EMPTY_CHANNEL_VIEW_RESPONSE)
    }

    if (
      isChannelRouteTargetLoaded({
        target,
        channel: channel.value,
        findAlbumByPublicId,
        findMediaByPublicId
      })
    ) {
      return Promise.resolve({
        data: channel.value
      })
    }

    const options = channelStore.routeTargetQueryOptions(target)
    if (options) {
      return runRouteQuery(options)
    }

    return Promise.resolve(EMPTY_CHANNEL_VIEW_RESPONSE)
  }

  const syncCanonicalSlugs = ({ route, context }) => {
    const canonicalPath = resolveCanonicalPathForRoute({
      route,
      context,
      canonicalPath: channel.value?.canonicalPath,
      channelContext: {
        channel: channel.value,
        findAlbumByPublicId,
        findMediaByPublicId,
        findAlbumByMediaPublicId
      }
    })

    if (canonicalPath && canonicalPath !== route.path) {
      router.replace({ path: canonicalPath, query: route.query })
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
    const context = resolveChannelRouteContext(route)

    loadStatus.value = 'loading'

    try {
      const loaded = await fetchChannelByRouteContext(context)

      if (isStale()) {
        return null
      }

      channel.value = loaded.data
      const loadedChannel = loaded.data

      syncChannelRouteHistory({ context, channel: loadedChannel })
      syncCanonicalSlugs({ route, context })

      metaData.value = getMetaData(route, loadedChannel)
      loadStatus.value = 'success'
      return loadedChannel
    } catch (error) {
      if (isStale()) {
        return null
      }

      channel.value = null
      loadStatus.value = 'error'
      metaData.value = getMetaData(null, null)
      console.error('Failed to load channel:', error)
      return null
    }
  }

  return {
    channel,
    sortedAllMedia,
    loadStatus,
    loading,
    routeContext,
    findAlbumByPublicId,
    findMediaByPublicId,
    findAlbumByMediaPublicId,
    loadChannel,
    metaData
  }
}
