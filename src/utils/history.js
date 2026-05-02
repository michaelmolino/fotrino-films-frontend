import { ref, watch } from 'vue'
import { LocalStorage } from 'quasar'

const HISTORY_KEY = 'fotrino-films-history'

let resolveHistoryPromise = null
let hasResolvedHistory = false

/**
 * @typedef {{ uuid: string, type: 'channel' | 'private' }} HistoryEntry
 */

/**
 * Migrate from legacy formats (string[] or object[]) to HistoryEntry[].
 * Any item already in {uuid, type} form is kept as-is.
 */
function parseStoredHistory(value) {
  if (!Array.isArray(value)) {
    return { entries: [], needsMigration: false }
  }

  /** @type {HistoryEntry[]} */
  const entries = []
  const seen = new Set()
  let needsMigration = false

  for (const item of value) {
    /** @type {HistoryEntry | null} */
    let entry = null

    if (item && typeof item === 'object' && typeof item.uuid === 'string') {
      if (item.type === 'channel' || item.type === 'private') {
        entry = { uuid: item.uuid, type: item.type }
      } else {
        // Legacy object format with uuid but no type — assume channel
        entry = { uuid: item.uuid, type: 'channel' }
        needsMigration = true
      }
    } else if (typeof item === 'string') {
      // Legacy plain-string UUID — assume channel
      entry = { uuid: item, type: 'channel' }
      needsMigration = true
    } else {
      needsMigration = true
      continue
    }

    const key = `${entry.type}:${entry.uuid}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(entry)
  }

  return { entries, needsMigration }
}

function writeHistory(entries) {
  LocalStorage.set(HISTORY_KEY, entries)
  history.value = entries
}

const parsedHistory = parseStoredHistory(LocalStorage.getItem(HISTORY_KEY))

/** @type {import('vue').Ref<HistoryEntry[]>} */
export const history = ref(parsedHistory.entries)
export const historyChannels = ref([])

if (parsedHistory.needsMigration) {
  LocalStorage.set(HISTORY_KEY, parsedHistory.entries)
}

/**
 * Add a channel to history.
 * @param {{ uuid: string, title?: string, slug?: string, cover?: string | null }} channel
 */
export function addHistory(channel) {
  if (!channel?.uuid) return
  _addEntry({ uuid: channel.uuid, type: 'channel' }, channel)
}

/**
 * Add a private media item to history.
 * @param {string} privateId
 * @param {{ title?: string, cover?: string | null }} details
 */
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

  if (hasResolvedHistory) {
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

export async function resolveHistoryFromBackend(store, { force = false } = {}) {
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
      return { channels: historyChannels.value, deletedUuids: [] }
    }

    try {
      const response = await store.dispatch('channel/resolveHistoryChannels', entries)
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
      historyChannels.value = activeEntries
        .map(e => itemsByKey.get(`${e.type}:${e.uuid}`))
        .filter(Boolean)

      hasResolvedHistory = true
      return { channels: historyChannels.value, deletedUuids }
    } catch {
      return { channels: historyChannels.value, deletedUuids: [] }
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
      if (newChannel?.uuid) {
        addHistory(newChannel)
      }
    },
    { immediate: true }
  )
}
