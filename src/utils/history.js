import { ref, watch } from 'vue'
import { LocalStorage } from 'quasar'

const HISTORY_KEY = 'fotrino-films-history'

let resolveHistoryPromise = null
let hasResolvedHistory = false

function parseStoredHistory(value) {
  if (!Array.isArray(value)) {
    return { uuids: [], needsMigration: false }
  }

  const uuids = []
  const seen = new Set()
  let needsMigration = false

  for (const item of value) {
    let uuid = null

    if (typeof item === 'string') {
      uuid = item
    } else if (item && typeof item === 'object' && typeof item.uuid === 'string') {
      uuid = item.uuid
      needsMigration = true
    } else {
      needsMigration = true
    }

    if (!uuid || seen.has(uuid)) {
      continue
    }

    seen.add(uuid)
    uuids.push(uuid)
  }

  return { uuids, needsMigration }
}

function writeHistoryUuids(uuids) {
  LocalStorage.set(HISTORY_KEY, uuids)
  history.value = uuids
}

const parsedHistory = parseStoredHistory(LocalStorage.getItem(HISTORY_KEY))
export const history = ref(parsedHistory.uuids)
export const historyChannels = ref([])

if (parsedHistory.needsMigration) {
  LocalStorage.set(HISTORY_KEY, parsedHistory.uuids)
}

export function addHistory(channel) {
  if (!channel?.uuid) return

  const current = [...history.value]
  if (!current.includes(channel.uuid)) {
    const updated = [...current, channel.uuid]
    writeHistoryUuids(updated)

    if (hasResolvedHistory) {
      historyChannels.value = [
        ...historyChannels.value,
        {
          uuid: channel.uuid,
          title: channel.title,
          slug: channel.slug,
          cover: channel.cover || null
        }
      ]
    }
  }
}

export function removeHistory(uuid) {
  const updated = history.value.filter(item => item !== uuid)
  writeHistoryUuids(updated)
  historyChannels.value = historyChannels.value.filter(channel => channel.uuid !== uuid)
}

export async function resolveHistoryFromBackend(store, { force = false } = {}) {
  if (hasResolvedHistory && !force) {
    return historyChannels.value
  }

  if (resolveHistoryPromise) {
    return resolveHistoryPromise
  }

  resolveHistoryPromise = (async () => {
    const uuids = [...history.value]

    if (uuids.length === 0) {
      historyChannels.value = []
      hasResolvedHistory = true
      return historyChannels.value
    }

    try {
      const data = await store.dispatch('channel/resolveHistoryChannels', uuids)

      if (!Array.isArray(data)) {
        return historyChannels.value
      }

      const channelsByUuid = new Map(data.filter(item => item?.uuid).map(item => [item.uuid, item]))
      historyChannels.value = uuids.map(uuid => channelsByUuid.get(uuid)).filter(Boolean)
      hasResolvedHistory = true
      return historyChannels.value
    } catch {
      return historyChannels.value
    } finally {
      resolveHistoryPromise = null
    }
  })()

  return resolveHistoryPromise
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
