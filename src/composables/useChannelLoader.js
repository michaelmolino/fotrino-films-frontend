import { computed, ref, toRef } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'
import { addPrivateHistory } from '@utils/history.js'

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
  const sortedAllMedia = toRef(channelStore, 'sortedAllMedia')
  const loadStatus = toRef(channelStore, 'loadStatus')
  const metaData = ref(getMetaData(null, null))
  const loadVersion = ref(0)
  const needsChannelData = computed(() => !!(
    route.params?.channelId ||
    route.params?.projectId ||
    route.params?.mediaId ||
    route.params?.privateMediaId
  ))
  const loading = computed(
    () => loadStatus.value === 'loading' || (loadStatus.value === 'idle' && needsChannelData.value)
  )

  // Only one owner should register meta updates to avoid conflicting page titles.
  if (manageMeta) {
    useMeta(() => metaData.value)
  }

  const fetchChannelByRoute = route => {
    if (route.params?.channelId) {
      return channelStore.getChannel({
        channelId: route.params.channelId
      })
    }
    if (route.params?.projectId) {
      return channelStore.getChannelByProject(route.params.projectId)
    }
    if (route.params?.mediaId) {
      return channelStore.getChannelByMedia(route.params.mediaId)
    }
    if (route.params?.privateMediaId) {
      return channelStore.getPrivateMedia(route.params.privateMediaId)
    }
    return Promise.resolve(null)
  }

  const syncPrivateHistory = (route, channel) => {
    if (!route.params?.privateMediaId || !channel) return
    addPrivateHistory(route.params.privateMediaId, {
      title: channel?.project?.media?.title || channel?.title || '',
      cover: channel?.project?.media?.preview || channel?.cover || null,
      slug: channel?.project?.media?.slug || route.params.mediaSlug || null
    })
  }

  const replacePath = (path, query) => {
    router.replace({ path, query })
  }

  const syncCanonicalSlugs = (route, channel) => {
    if (route.params?.channelId && channel?.uuid && channel.slug && channel.slug !== route.params.channelSlug) {
      replacePath(`/c/${channel.uuid}/${channel.slug}`, route.query)
      return
    }

    if (route.params?.projectId && channel?.projects?.length) {
      const project = channel.projects.find(item => item.uuid === route.params.projectId)
      if (project?.uuid && project.slug && project.slug !== route.params.projectSlug) {
        replacePath(`/p/${project.uuid}/${project.slug}`, route.query)
        return
      }
    }

    if (route.params?.mediaId && channel?.projects?.length) {
      const project = channel.projects.find(item =>
        Array.isArray(item.media) && item.media.some(media => media.uuid === route.params.mediaId)
      )
      const media = project?.media?.find(item => item.uuid === route.params.mediaId)
      if (media?.uuid && media.slug && media.slug !== route.params.mediaSlug) {
        replacePath(`/m/${media.uuid}/${media.slug}`, route.query)
      }
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
      const channel = await fetchChannelByRoute(route)

      if (isStale()) {
        return null
      }

      syncPrivateHistory(route, channel)
      syncCanonicalSlugs(route, channel)

      metaData.value = getMetaData(route, channel)
      channelStore.setChannelLoadStatus('success')
      return channel
    } catch (error) {
      if (isStale()) {
        return null
      }

      channelStore.setChannel(null)
      channelStore.setChannelLoadStatus('error')
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
    loadChannel,
    metaData
  }
}
