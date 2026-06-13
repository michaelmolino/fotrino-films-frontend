import { ref } from 'vue'
import { LocalStorage } from 'quasar'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

/** @typedef {{ resourceId: string, type: 'channel' | 'privateMedia' | 'privateAlbum' }} HistoryEntry */

const HISTORY_KEY = 'fotrino-films-history'
const HISTORY_TYPES = new Set(['channel', 'privateMedia', 'privateAlbum'])

function isValidHistoryEntry(entry) {
  return (
    entry &&
    typeof entry === 'object' &&
    HISTORY_TYPES.has(entry.type) &&
    typeof entry.resourceId === 'string' &&
    entry.resourceId.length > 0
  )
}

function loadStoredHistory() {
  const stored = LocalStorage.getItem(HISTORY_KEY)

  if (stored == null) {
    return []
  }

  let entries
  if (Array.isArray(stored)) {
    entries = stored
  } else if (typeof stored === 'string') {
    try {
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        LocalStorage.remove(HISTORY_KEY)
        return []
      }
      entries = parsed
    } catch {
      LocalStorage.remove(HISTORY_KEY)
      return []
    }
  } else {
    LocalStorage.remove(HISTORY_KEY)
    return []
  }

  const seen = new Set()
  const validEntries = []
  for (const entry of entries) {
    if (!isValidHistoryEntry(entry)) {
      continue
    }

    const key = `${entry.type}:${entry.resourceId}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    validEntries.push(entry)
  }

  if (validEntries.length !== entries.length || !entries.every(isValidHistoryEntry)) {
    LocalStorage.set(HISTORY_KEY, validEntries)
  }

  return validEntries
}

export const history = ref(loadStoredHistory())
export const historyChannels = ref([])

let hasResolvedHistory = false

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

function buildStoredHistoryFromResolvedItems(items) {
  return items.map(item => ({
    type: item.type,
    resourceId: item.resourceId
  }))
}

export function syncHistoryFromRouteContext({ context, channel }) {
  if (!context.isPrivate && channel) {
    addToHistory({ type: 'channel', resourceId: channel.publicId, details: channel })
  }

  if (context.type === 'privateMedia' && context.privateMediaId && channel) {
    const media = channel.album.media.find(item => item.privateId === context.privateMediaId)

    addToHistory({
      type: 'privateMedia',
      resourceId: context.privateMediaId,
      details: {
        title: media.title || channel.title,
        cover:
          resolveImagePrimaryUrl(media.previewAsset) || resolveImagePrimaryUrl(channel.coverAsset),
        canonicalPath: media.canonicalPath
      }
    })
  }

  if (context.privateAlbumId && channel.album) {
    const album = channel.album
    addToHistory({
      type: 'privateAlbum',
      resourceId: context.privateAlbumId,
      details: {
        title: album.title || channel.title,
        cover:
          resolveImagePrimaryUrl(album.posterAsset) || resolveImagePrimaryUrl(channel.coverAsset),
        canonicalPath: album.canonicalPath
      }
    })
  }
}

export function buildCurrentHistoryEntryFromContext(context) {
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
  return (
    entry.canonicalPath.privateAlbumPath ||
    entry.canonicalPath.privatePath ||
    entry.canonicalPath.publicPath
  )
}

export function addToHistory({ type, resourceId, details = {} }) {
  const entry = { type, resourceId }
  if (history.value.some(item => `${item.type}:${item.resourceId}` === `${type}:${resourceId}`))
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
        title: details.title,
        cover: details.cover,
        canonicalPath: details.canonicalPath
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
      const response = await channelStore.resolveHistory({
      items: entries,
      current: hasCurrentEntry ? currentEntry : null
    })
    const items = response.items
    const deletedItems = response.deletedItems

    if (!Array.isArray(items) || !Array.isArray(deletedItems)) {
      throw new TypeError('Invalid history response')
    }

    commitHistory(buildStoredHistoryFromResolvedItems(items))
    historyChannels.value = items

    hasResolvedHistory = true
    return { channels: historyChannels.value, deletedItems }
  } catch {
    return { channels: historyChannels.value, deletedItems: [] }
  }
}
