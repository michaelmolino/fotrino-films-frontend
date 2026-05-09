import { computed, toRef } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useRoute } from 'vue-router'

export function useChannelLoading() {
    const channelStore = useChannelStore()
    const route = useRoute()
    const channel = toRef(channelStore, 'channel')
    const sortedAllMedia = toRef(channelStore, 'sortedAllMedia')
    const loadStatus = toRef(channelStore, 'loadStatus')
    const needsChannelData = computed(() => !!(route.params?.uuid || route.params?.privateId))
    const loading = computed(
        () => loadStatus.value === 'loading' || (loadStatus.value === 'idle' && needsChannelData.value)
    )

    return {
        channel,
        sortedAllMedia,
        loadStatus,
        loading
    }
}
