import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'
import { addPrivateHistory } from '@utils/history.js'

/**
 * Composable for loading and setting channel data based on route parameters
 * Also manages page metadata updates
 * @returns {Object} - Object with loadChannel method and metaData ref
 */
export function useChannelLoader() {
  const store = useStore()
  const router = useRouter()
  const metaData = ref(getMetaData(null, null))
  const loadVersion = ref(0)

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

    store.commit('channel/SET_CHANNEL_LOAD_STATUS', 'loading')

    try {
      let channel = null

      if (route.params?.uuid) {
        channel = await store.cache.dispatch('channel/fetchChannelRaw', {
          uuid: route.params.uuid
        })
      } else if (route.params?.privateId) {
        channel = await store.cache.dispatch('channel/fetchPrivateMediaRaw', route.params.privateId)
      }

      if (isStale()) {
        return null
      }

      store.commit('channel/SET_CHANNEL', channel)

      if (route.params?.privateId && channel) {
        addPrivateHistory(route.params.privateId, {
          title: channel?.project?.media?.title || channel?.title || '',
          cover: channel?.cover || null
        })
      }

      if (route.params?.uuid && channel?.uuid && channel.slug && channel.slug !== route.params.channelSlug) {
        router.replace({
          params: { channelSlug: channel.slug },
          query: route.query
        })
      }

      metaData.value = getMetaData(route, channel)
      store.commit('channel/SET_CHANNEL_LOAD_STATUS', 'success')
      return channel
    } catch (error) {
      if (isStale()) {
        return null
      }

      store.commit('channel/SET_CHANNEL', null)
      store.commit('channel/SET_CHANNEL_LOAD_STATUS', 'error')
      metaData.value = getMetaData(null, null)
      console.error('Failed to load channel:', error)
      return null
    }
  }

  return {
    loadChannel,
    metaData
  }
}
