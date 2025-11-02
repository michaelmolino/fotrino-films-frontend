import { LocalStorage } from 'quasar'

const VIEW_KEY = 'fotrino-films-view'
const ALLOWED = new Set(['projects', 'main', 'all'])

export function getViewPreference(defaultValue = 'all') {
  try {
    const val = LocalStorage.getItem(VIEW_KEY)
    return typeof val === 'string' && ALLOWED.has(val) ? val : String(defaultValue)
  } catch {
    return String(defaultValue)
  }
}

export function setViewPreference(value) {
  if (!ALLOWED.has(value)) return
  LocalStorage.set(VIEW_KEY, value)
}
