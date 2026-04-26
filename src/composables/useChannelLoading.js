import { ref, toRef, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

export function useChannelLoading() {
    const store = useStore()
    const route = useRoute()
    const channel = toRef(store.state.channel, 'channel')
    const loading = ref(true)

    watch(
        [channel, () => route.params.uuid],
        ([newChannel, newUuid]) => {
            if (newUuid && newChannel?.uuid !== newUuid) {
                loading.value = true
            } else if (newChannel?.uuid === newUuid) {
                loading.value = false
            } else if (!newUuid) {
                loading.value = false
            }
        },
        { immediate: true }
    )

    return { channel, loading }
}
