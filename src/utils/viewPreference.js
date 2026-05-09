import { LocalStorage } from 'quasar'

const VIEW_KEY = 'fotrino-films-view'
const ALLOWED = new Set(['projects', 'all'])

// Get the user's preferred view, or fallback to default
export function getViewPreference(defaultValue = 'all') {
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
  const toSet = ALLOWED.has(value) ? value : 'all'
  LocalStorage.set(VIEW_KEY, toSet)
}
