// Storage and migration logic for history.js
import { LocalStorage } from 'quasar'

export const HISTORY_KEY = 'fotrino-films-history'

/**
 * Migrate to strict HistoryEntry[] format.
 * Legacy uuid-based entries are intentionally dropped.
 */
export function parseStoredHistory(value) {
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

    if (item && typeof item === 'object' && typeof item.publicId === 'string') {
      if (item.type === 'channel' || item.type === 'privateMedia' || item.type === 'privateAlbum') {
        entry = { publicId: item.publicId, type: item.type }
      } else {
        needsMigration = true
        continue
      }
    } else if (
      typeof item === 'string' ||
      (item && typeof item === 'object' && typeof item.uuid === 'string')
    ) {
      // Drop legacy history entries keyed by uuid.
      needsMigration = true
      continue
    }

    const key = `${entry.type}:${entry.publicId}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(entry)
  }

  return { entries, needsMigration }
}

export function writeHistory(entries) {
  LocalStorage.set(HISTORY_KEY, entries)
}
