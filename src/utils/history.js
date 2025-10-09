import { ref, watch } from 'vue'
import { LocalStorage } from 'quasar'

const HISTORY_KEY = 'fotrino-films-history'

export const history = ref(LocalStorage.getItem(HISTORY_KEY) || [])

export function addHistory(channel) {
  if (!channel?.uuid || !channel?.title || !channel?.slug) return

  const current = LocalStorage.getItem(HISTORY_KEY) || []
  if (!current.some(c => c.uuid === channel.uuid)) {
    const updated = [
      ...current,
      {
        uuid: channel.uuid,
        title: channel.title,
        slug: channel.slug,
        cover: channel.cover
      }
    ]
    LocalStorage.set(HISTORY_KEY, updated)
    history.value = updated
  }
}

export function removeHistory(uuid) {
  const current = LocalStorage.getItem(HISTORY_KEY) || []
  const updated = current.filter(u => u.uuid !== uuid)
  LocalStorage.set(HISTORY_KEY, updated)
  history.value = updated
}

export function watchChannelHistory(store) {
  return watch(
    () => store.state.channel.channel,
    newChannel => {
      if (newChannel) {
        addHistory(newChannel)
      }
    },
    { immediate: true }
  )
}
