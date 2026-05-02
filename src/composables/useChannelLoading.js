import { computed, toRef } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export function useChannelLoading() {
    const store = useStore()
    const route = useRoute()
    const channel = toRef(store.state.channel, 'channel')
    const loadStatus = toRef(store.state.channel, 'loadStatus')
    const needsChannelData = computed(() => !!(route.params?.uuid || route.params?.privateId))
    const loading = computed(
        () => loadStatus.value === 'loading' || (loadStatus.value === 'idle' && needsChannelData.value)
    )

    return {
        channel,
        loadStatus,
        loading
    }
}
