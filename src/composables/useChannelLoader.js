import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { getMetaData } from '@utils/meta.js'

/**
 * Composable for loading and setting channel data based on route parameters
 * Also manages page metadata updates
 * @returns {Object} - Object with loadChannel method and metaData ref
 */
export function useChannelLoader() {
  const store = useStore()
  const router = useRouter()
  const metaData = ref(getMetaData(null, null))

  // Setup Quasar meta management
  useMeta(() => metaData.value)

  /**
   * Load channel data from route params and update store/router/metadata
   * @param {Object} route - Vue Router route object
   * @returns {Promise<Object|null>} - Channel object or null
   */
  const loadChannel = async route => {
    try {
      let channel = null

      if (route.params?.uuid) {
        channel = await store.cache.dispatch('channel/getChannel', {
          uuid: route.params.uuid
        })
        store.commit('channel/SET_CHANNEL', channel)
      } else if (route.params?.privateId) {
        channel = await store.cache.dispatch('channel/getPrivateMedia', route.params.privateId)
        store.commit('channel/SET_CHANNEL', channel)
      }

      if (channel?.uuid) {
        router.replace({
          params: { channelSlug: channel.slug },
          query: route.query
        })
      }

      metaData.value = getMetaData(route, channel)
      return channel
    } catch (error) {
      store.commit('channel/SET_CHANNEL', null)
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
