import { LocalStorage } from 'quasar'

const VIEW_KEY = 'fotrino-films-view'
const ALLOWED = new Set(['albums', 'all'])

// Get the user's preferred view, or fallback to default
export function getViewPreference(defaultValue = 'albums') {
  try {
    const val = LocalStorage.getItem(VIEW_KEY)
    if (typeof val === 'string' && ALLOWED.has(val)) return val
    return defaultValue
  } catch {
    return defaultValue
  }
}

// Set the user's preferred view if allowed
export function setViewPreference(value) {
  const toSet = ALLOWED.has(value) ? value : 'albums'
  LocalStorage.set(VIEW_KEY, toSet)
}
