import { ref } from 'vue'
let hasResolvedHistory = false
let resolveHistoryPromise = null
import { parseStoredHistory, writeHistory, HISTORY_KEY } from './historyStorage.js'

/** @typedef {{ resourceId: string, type: 'channel' | 'privateMedia' | 'privateAlbum' }} HistoryEntry */

import { LocalStorage } from 'quasar'
const storedHistory = LocalStorage.getItem(HISTORY_KEY)
const parsedHistory = parseStoredHistory(storedHistory)
export const history = ref(parsedHistory)
export const historyChannels = ref([])

function getChannelHistoryId(channel) {
  return channel?.publicId || null
}

function persistHistory(entries) {
  history.value = entries
  writeHistory(entries)
}

if (JSON.stringify(storedHistory) !== JSON.stringify(parsedHistory)) {
  writeHistory(parsedHistory)
}

export function addHistory(channel) {
  const historyId = getChannelHistoryId(channel)
  if (!historyId) return
  _addEntry({ resourceId: historyId, type: 'channel' }, channel)
}

export function addPrivateHistory(privateId, details = {}) {
  if (!privateId) return
  _addEntry({ resourceId: privateId, type: 'privateMedia' }, { resourceId: privateId, ...details })
}

export function addPrivateAlbumHistory(privateId, details = {}) {
  if (!privateId) return
  _addEntry({ resourceId: privateId, type: 'privateAlbum' }, { resourceId: privateId, ...details })
}

function _addEntry(entry, channelData) {
  const current = [...history.value]
  const key = `${entry.type}:${entry.resourceId}`
  const existingKeys = new Set(current.map(item => `${item.type}:${item.resourceId}`))
  const isDupe = existingKeys.has(key)
  if (isDupe) return

  const updated = [...current, entry]
  persistHistory(updated)

  // Optimistically append when resolve has completed or is in-flight —
  // we already have all display data so there is no need to wait.
  if (hasResolvedHistory || resolveHistoryPromise !== null) {
    historyChannels.value = [
      ...historyChannels.value,
      {
        resourceId: entry.resourceId,
        type: entry.type,
        title: channelData?.title || '',
        slug: channelData?.slug || null,
        cover: channelData?.cover || null
      }
    ]
  }
}

export function removeHistory(resourceId, type = null) {
  const updated = history.value.filter(item => {
    if (item.resourceId !== resourceId) return true
    if (type == null) return false
    return item.type !== type
  })
  persistHistory(updated)
  historyChannels.value = historyChannels.value.filter(item => {
    if (item.resourceId !== resourceId) return true
    if (type == null) return false
    return item.type !== type
  })
}

export async function resolveHistoryFromBackend(channelStore, { force = false } = {}) {
  if (hasResolvedHistory && !force) {
    return { channels: historyChannels.value, deletedItems: [] }
  }

  if (resolveHistoryPromise) {
    return resolveHistoryPromise
  }

  resolveHistoryPromise = (async () => {
    const entries = [...history.value]

    if (entries.length === 0) {
      historyChannels.value = []
      hasResolvedHistory = true
      return { channels: [], deletedItems: [] }
    }

    try {
      const response = await channelStore.resolveHistoryChannels(entries)
      const items = Array.isArray(response?.items) ? response.items : []
      const deletedItems = Array.isArray(response?.deletedItems)
        ? response.deletedItems
        : []

      if (deletedItems.length > 0) {
        const deletedSet = new Set(
          deletedItems
            .filter(item => item?.type && item?.resourceId)
            .map(item => `${item.type}:${item.resourceId}`)
        )
        const remaining = entries.filter(e => !deletedSet.has(`${e.type}:${e.resourceId}`))
        if (remaining.length !== entries.length) {
          persistHistory(remaining)
        }
      }

      const uniqueActiveEntries = []
      const seenEntryKeys = new Set()
      for (const entry of history.value) {
        const entryKey = `${entry.type}:${entry.resourceId}`
        if (seenEntryKeys.has(entryKey)) continue
        seenEntryKeys.add(entryKey)
        uniqueActiveEntries.push(entry)
      }

      if (uniqueActiveEntries.length !== history.value.length) {
        persistHistory(uniqueActiveEntries)
      }

      const itemsByKey = new Map(
        items.filter(item => item?.resourceId).map(item => [`${item.type}:${item.resourceId}`, item])
      )

      // Entries added during the in-flight request are already in historyChannels
      // (optimistically appended by _addEntry). Preserve them for any key the
      // backend didn't return so they aren't lost when we rebuild the list.
      const optimisticByKey = new Map(
        historyChannels.value.map(h => [`${h.type}:${h.resourceId}`, h])
      )
      historyChannels.value = uniqueActiveEntries
        .map(e => {
          const key = `${e.type}:${e.resourceId}`
          return itemsByKey.get(key) || optimisticByKey.get(key) || null
        })
        .filter(Boolean)

      hasResolvedHistory = true
      return { channels: historyChannels.value, deletedItems }
    } catch {
      return { channels: historyChannels.value, deletedItems: [] }
    }
  })()

  try {
    return await resolveHistoryPromise
  } finally {
    resolveHistoryPromise = null
  }
}
