import { computed, ref, toRef } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useRoute, useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'
import { addPrivateHistory } from '@utils/history.js'

/**
 * Composable for loading and setting channel data based on route parameters
 * Also manages page metadata updates
 * @returns {Object} - Object with loadChannel method and metaData ref
 */
export function useChannelLoader() {
  const channelStore = useChannelStore()
  const route = useRoute()
  const router = useRouter()
  const channel = toRef(channelStore, 'channel')
  const sortedAllMedia = toRef(channelStore, 'sortedAllMedia')
  const loadStatus = toRef(channelStore, 'loadStatus')
  const metaData = ref(getMetaData(null, null))
  const loadVersion = ref(0)
  const needsChannelData = computed(() => !!(route.params?.uuid || route.params?.privateId))
  const loading = computed(
    () => loadStatus.value === 'loading' || (loadStatus.value === 'idle' && needsChannelData.value)
  )

  // Setup Quasar meta management
  useMeta(() => metaData.value)

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
      let channel = null

      if (route.params?.uuid) {
        channel = await channelStore.getChannel({
          uuid: route.params.uuid
        })
      } else if (route.params?.privateId) {
        channel = await channelStore.getPrivateMedia(route.params.privateId)
      }

      if (isStale()) {
        return null
      }

      if (route.params?.privateId && channel) {
        addPrivateHistory(route.params.privateId, {
          title: channel?.project?.media?.title || channel?.title || '',
          cover: channel?.project?.media?.preview || channel?.cover || null
        })
      }

      if (route.params?.uuid && channel?.uuid && channel.slug && channel.slug !== route.params.channelSlug) {
        router.replace({
          params: { channelSlug: channel.slug },
          query: route.query
        })
      }

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
