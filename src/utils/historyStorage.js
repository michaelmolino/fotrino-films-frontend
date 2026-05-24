// Storage normalization logic for history.js
import { LocalStorage } from 'quasar'

export const HISTORY_KEY = 'fotrino-films-history'

/**
 * Parse to strict HistoryEntry[] format.
 * Any invalid entry is dropped.
 */
export function parseStoredHistory(value) {
  if (!Array.isArray(value)) {
    return []
  }

  /** @type {HistoryEntry[]} */
  const entries = []
  const seen = new Set()

  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    if (typeof item.publicId !== 'string') continue
    if (item.type !== 'channel' && item.type !== 'privateMedia' && item.type !== 'privateAlbum') {
      continue
    }

    const entry = { publicId: item.publicId, type: item.type }
    const key = `${entry.type}:${entry.publicId}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(entry)
  }

  return entries
}

export function writeHistory(entries) {
  LocalStorage.set(HISTORY_KEY, entries)
}
