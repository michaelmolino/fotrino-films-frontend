import { ref, watch } from 'vue'
import { LocalStorage } from 'quasar'

const DARK_KEY = 'fotrino-films-darkmode'
export const darkModePref = ref(LocalStorage.getItem(DARK_KEY) || 'auto')
export const systemDark = ref(globalThis.matchMedia('(prefers-color-scheme: dark)').matches)

export const darkModeIcons = {
  light: 'light_mode',
  auto: 'contrast',
  dark: 'nights_stay'
}

function applyDarkMode($q) {
  if (darkModePref.value === 'auto') {
    $q.dark.set(systemDark.value)
  } else {
    $q.dark.set(darkModePref.value === 'dark')
  }
}

export function setDarkMode(mode) {
  darkModePref.value = mode
}

export function useDarkMode($q) {
  // Apply dark mode immediately
  applyDarkMode($q)

  watch(darkModePref, val => {
    LocalStorage.set(DARK_KEY, val)
    applyDarkMode($q)
  })

  // Set up system preference listener
  const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', e => {
    systemDark.value = e.matches
    if (darkModePref.value === 'auto') applyDarkMode($q)
  })

  return {
    darkModePref,
    setDarkMode
  }
}
