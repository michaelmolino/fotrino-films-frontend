import { ref } from 'vue'
let hasResolvedHistory = false
let resolveHistoryPromise = null
import { parseStoredHistory, writeHistory, HISTORY_KEY } from './historyStorage.js'

/** @typedef {{ publicId: string, type: 'channel' | 'privateMedia' | 'privateAlbum' }} HistoryEntry */

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
  _addEntry({ publicId: historyId, type: 'channel' }, channel)
}

export function addPrivateHistory(privateId, details = {}) {
  if (!privateId) return
  _addEntry({ publicId: privateId, type: 'privateMedia' }, { publicId: privateId, ...details })
}

export function addPrivateAlbumHistory(privateId, details = {}) {
  if (!privateId) return
  _addEntry({ publicId: privateId, type: 'privateAlbum' }, { publicId: privateId, ...details })
}

function _addEntry(entry, channelData) {
  const current = [...history.value]
  const key = `${entry.type}:${entry.publicId}`
  const existingKeys = new Set(current.map(item => `${item.type}:${item.publicId}`))
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
        publicId: entry.publicId,
        type: entry.type,
        title: channelData?.title || '',
        slug: channelData?.slug || null,
        cover: channelData?.cover || null
      }
    ]
  }
}

export function removeHistory(publicId, type = null) {
  const updated = history.value.filter(item => {
    if (item.publicId !== publicId) return true
    if (type == null) return false
    return item.type !== type
  })
  persistHistory(updated)
  historyChannels.value = historyChannels.value.filter(item => {
    if (item.publicId !== publicId) return true
    if (type == null) return false
    return item.type !== type
  })
}

export async function resolveHistoryFromBackend(channelStore, { force = false } = {}) {
  if (hasResolvedHistory && !force) {
    return { channels: historyChannels.value, deletedPublicIds: [] }
  }

  if (resolveHistoryPromise) {
    return resolveHistoryPromise
  }

  resolveHistoryPromise = (async () => {
    const entries = [...history.value]

    if (entries.length === 0) {
      historyChannels.value = []
      hasResolvedHistory = true
      return { channels: [], deletedPublicIds: [] }
    }

    try {
      const response = await channelStore.resolveHistoryChannels(entries)
      const items = Array.isArray(response?.items) ? response.items : []
      const deletedPublicIds = Array.isArray(response?.deletedPublicIds)
        ? response.deletedPublicIds
        : []

      if (deletedPublicIds.length > 0) {
        const deletedSet = new Set(deletedPublicIds)
        const remaining = entries.filter(e => !deletedSet.has(e.publicId))
        if (remaining.length !== entries.length) {
          persistHistory(remaining)
        }
      }

      const uniqueActiveEntries = []
      const seenEntryKeys = new Set()
      for (const entry of history.value) {
        const entryKey = `${entry.type}:${entry.publicId}`
        if (seenEntryKeys.has(entryKey)) continue
        seenEntryKeys.add(entryKey)
        uniqueActiveEntries.push(entry)
      }

      if (uniqueActiveEntries.length !== history.value.length) {
        persistHistory(uniqueActiveEntries)
      }

      const itemsByKey = new Map(
        items.filter(item => item?.publicId).map(item => [`${item.type}:${item.publicId}`, item])
      )

      // Entries added during the in-flight request are already in historyChannels
      // (optimistically appended by _addEntry). Preserve them for any key the
      // backend didn't return so they aren't lost when we rebuild the list.
      const optimisticByKey = new Map(
        historyChannels.value.map(h => [`${h.type}:${h.publicId}`, h])
      )
      historyChannels.value = uniqueActiveEntries
        .map(e => {
          const key = `${e.type}:${e.publicId}`
          return itemsByKey.get(key) || optimisticByKey.get(key) || null
        })
        .filter(Boolean)

      hasResolvedHistory = true
      return { channels: historyChannels.value, deletedPublicIds }
    } catch {
      return { channels: historyChannels.value, deletedPublicIds: [] }
    }
  })()

  try {
    return await resolveHistoryPromise
  } finally {
    resolveHistoryPromise = null
  }
}

