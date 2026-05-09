import { ref, watch } from 'vue'
let hasResolvedHistory = false
let resolveHistoryPromise = null
import { parseStoredHistory, writeHistory, HISTORY_KEY } from './historyStorage.js'

/** @typedef {{ uuid: string, type: 'channel' | 'private' }} HistoryEntry */

import { LocalStorage } from 'quasar'
const parsedHistory = parseStoredHistory(LocalStorage.getItem(HISTORY_KEY))
export const history = ref(parsedHistory.entries)
export const historyChannels = ref([])

if (parsedHistory.needsMigration) {
  writeHistory(parsedHistory.entries)
}

export function addHistory(channel) {
  if (!channel?.uuid) return
  _addEntry({ uuid: channel.uuid, type: 'channel' }, channel)
}

export function addPrivateHistory(privateId, details = {}) {
  if (!privateId) return
  _addEntry({ uuid: privateId, type: 'private' }, { uuid: privateId, ...details })
}

function _addEntry(entry, channelData) {
  const current = [...history.value]
  const key = `${entry.type}:${entry.uuid}`
  const isDupe = current.some(e => `${e.type}:${e.uuid}` === key)
  if (isDupe) return

  const updated = [...current, entry]
  writeHistory(updated)

  // Optimistically append when resolve has completed or is in-flight —
  // we already have all display data so there is no need to wait.
  if (hasResolvedHistory || resolveHistoryPromise !== null) {
    historyChannels.value = [
      ...historyChannels.value,
      {
        uuid: entry.uuid,
        type: entry.type,
        title: channelData?.title || '',
        slug: channelData?.slug || null,
        cover: channelData?.cover || null
      }
    ]
  }
}

export function removeHistory(uuid) {
  const updated = history.value.filter(item => item.uuid !== uuid)
  writeHistory(updated)
  historyChannels.value = historyChannels.value.filter(item => item.uuid !== uuid)
}

export async function resolveHistoryFromBackend(channelStore, { force = false } = {}) {
  if (hasResolvedHistory && !force) {
    return { channels: historyChannels.value, deletedUuids: [] }
  }

  if (resolveHistoryPromise) {
    return resolveHistoryPromise
  }

  resolveHistoryPromise = (async () => {
    const entries = [...history.value]

    if (entries.length === 0) {
      historyChannels.value = []
      hasResolvedHistory = true
      return { channels: [], deletedUuids: [] }
    }

    try {
      const response = await channelStore.resolveHistoryChannels(entries)
      const items = Array.isArray(response?.items) ? response.items : []
      const deletedUuids = Array.isArray(response?.deletedUuids) ? response.deletedUuids : []

      if (deletedUuids.length > 0) {
        const deletedSet = new Set(deletedUuids)
        const remaining = entries.filter(e => !deletedSet.has(e.uuid))
        if (remaining.length !== entries.length) {
          writeHistory(remaining)
        }
      }

      const activeEntries = [...history.value]
      const itemsByKey = new Map(
        items.filter(item => item?.uuid).map(item => [`${item.type}:${item.uuid}`, item])
      )

      // Entries added during the in-flight request are already in historyChannels
      // (optimistically appended by _addEntry). Preserve them for any key the
      // backend didn't return so they aren't lost when we rebuild the list.
      const optimisticByKey = new Map(
        historyChannels.value.map(h => [`${h.type}:${h.uuid}`, h])
      )
      historyChannels.value = activeEntries
        .map(e => {
          const key = `${e.type}:${e.uuid}`
          return itemsByKey.get(key) || optimisticByKey.get(key) || null
        })
        .filter(Boolean)

      hasResolvedHistory = true
      return { channels: historyChannels.value, deletedUuids }
    } catch {
      return { channels: historyChannels.value, deletedUuids: [] }
    }
  })()

  try {
    return await resolveHistoryPromise
  } finally {
    resolveHistoryPromise = null
  }
}

export function watchChannelHistory(channelStore) {
  return watch(
    () => channelStore.channel,
    newChannel => {
      if (newChannel?.uuid) {
        addHistory(newChannel)
      }
    },
    { immediate: true }
  )
}
