// Storage and migration logic for history.js
import { LocalStorage } from 'quasar'

export const HISTORY_KEY = 'fotrino-films-history'

/**
 * Migrate from legacy formats (string[] or object[]) to HistoryEntry[].
 * Any item already in {uuid, type} form is kept as-is.
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

export function writeHistory(entries) {
    LocalStorage.set(HISTORY_KEY, entries)
}