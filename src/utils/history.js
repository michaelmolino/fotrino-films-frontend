import { ref } from 'vue'
import { LocalStorage } from 'quasar'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

/** @typedef {{ resourceId: string, type: 'channel' | 'privateMedia' | 'privateAlbum' }} HistoryEntry */

const HISTORY_KEY = 'fotrino-films-history'

function parseStoredHistory(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const entries = []
  const seen = new Set()

  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    if (typeof item.resourceId !== 'string') continue
    if (item.type !== 'channel' && item.type !== 'privateMedia' && item.type !== 'privateAlbum') {
      continue
    }

    const entry = { resourceId: item.resourceId, type: item.type }
    const key = `${entry.type}:${entry.resourceId}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(entry)
  }

  return entries
}

const storedHistory = LocalStorage.getItem(HISTORY_KEY)
const parsedHistory = parseStoredHistory(storedHistory)
export const history = ref(parsedHistory)
export const historyChannels = ref([])

let hasResolvedHistory = false

function buildHistoryKey(type, resourceId) {
  return `${type}:${resourceId}`
}

function excludeHistoryEntries(entries, resourceId, type = null) {
  return entries.filter(item => {
    if (item.resourceId !== resourceId) return true
    if (type == null) return false
    return item.type !== type
  })
}

function commitHistory(entries) {
  history.value = entries
  LocalStorage.set(HISTORY_KEY, entries)
}

if (JSON.stringify(storedHistory) !== JSON.stringify(parsedHistory)) {
  LocalStorage.set(HISTORY_KEY, parsedHistory)
}

export function addHistory(channel) {
  const historyId = channel?.publicId || null
  if (!historyId) return
  addToHistory({ type: 'channel', resourceId: historyId, details: channel })
}

export function addPrivateHistory(privateId, details = {}) {
  if (!privateId) return
  addToHistory({ type: 'privateMedia', resourceId: privateId, details })
}

export function addPrivateAlbumHistory(privateId, details = {}) {
  if (!privateId) return
  addToHistory({ type: 'privateAlbum', resourceId: privateId, details })
}

export function syncHistoryFromRouteContext({ context, channel }) {
  if (!context.isPrivate && channel) {
    addHistory(channel)
  }

  if (context.type === 'privateMedia' && context.privateMediaId && channel) {
    const media =
      (channel?.album?.media || []).find(item => item?.privateId === context.privateMediaId) || null

    addPrivateHistory(context.privateMediaId, {
      title: media?.title || channel?.title || '',
      cover: resolveImagePrimaryUrl(media?.previewAsset) || resolveImagePrimaryUrl(channel?.coverAsset) || null,
      canonicalPath: media?.canonicalPath || null
    })
  }

  if (context.privateAlbumId && channel?.album) {
    const album = channel.album
    addPrivateAlbumHistory(context.privateAlbumId, {
      title: album?.title || channel?.title || '',
      cover: resolveImagePrimaryUrl(album?.posterAsset) || resolveImagePrimaryUrl(channel?.coverAsset) || null,
      canonicalPath: album?.canonicalPath || null
    })
  }
}

export function buildCurrentHistoryEntryFromContext(context) {
  if (!context) return null

  if (context.privateAlbumId) {
    return { type: 'privateAlbum', resourceId: context.privateAlbumId }
  }

  if (context.type === 'privateMedia' && context.privateMediaId) {
    return { type: 'privateMedia', resourceId: context.privateMediaId }
  }

  if (!context.isPrivate && context.channelPublicId) {
    return { type: 'channel', resourceId: context.channelPublicId }
  }

  return null
}

export function resolveHistoryTargetPath(entry) {
  const canonicalPath = entry?.canonicalPath
  if (!canonicalPath || typeof canonicalPath !== 'object') {
    return null
  }

  return canonicalPath.privateAlbumPath || canonicalPath.privatePath || canonicalPath.publicPath || null
}

export function addToHistory({ type, resourceId, details = {} }) {
  if (!type || !resourceId) return

  const entry = { type, resourceId }
  if (
    history.value.some(
      item => buildHistoryKey(item.type, item.resourceId) === buildHistoryKey(type, resourceId)
    )
  )
    return

  const updated = [...history.value, entry]
  commitHistory(updated)

  // After initial resolve, we already have display data for new entries.
  if (hasResolvedHistory) {
    historyChannels.value = [
      ...historyChannels.value,
      {
        resourceId: entry.resourceId,
        type: entry.type,
        title: details?.title || '',
        cover: details?.cover || null,
        canonicalPath: details?.canonicalPath || null
      }
    ]
  }
}

export function removeHistory(resourceId, type = null) {
  const updated = excludeHistoryEntries(history.value, resourceId, type)
  commitHistory(updated)
  historyChannels.value = excludeHistoryEntries(historyChannels.value, resourceId, type)
}

export async function resolveHistoryFromBackend(
  channelStore,
  { force = false, currentEntry = null } = {}
) {
  if (hasResolvedHistory && !force) {
    return { channels: historyChannels.value, deletedItems: [] }
  }
  const entries = [...history.value]
  const hasCurrentEntry = Boolean(currentEntry?.type && currentEntry?.resourceId)

  if (entries.length === 0 && !hasCurrentEntry) {
    historyChannels.value = []
    hasResolvedHistory = true
    return { channels: [], deletedItems: [] }
  }

  try {
    const response = await channelStore.resolveHistoryChannels({
      items: entries,
      current: hasCurrentEntry ? currentEntry : null
    })
    const items = Array.isArray(response?.items) ? response.items : []
    const deletedItems = Array.isArray(response?.deletedItems) ? response.deletedItems : []
    const persistedItems = parseStoredHistory(response?.persistedItems)

    commitHistory(persistedItems)
    historyChannels.value = items

    hasResolvedHistory = true
    return { channels: historyChannels.value, deletedItems }
  } catch {
    return { channels: historyChannels.value, deletedItems: [] }
  }
}
