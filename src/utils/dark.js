import { ref, watch, onMounted } from 'vue'
import { LocalStorage } from 'quasar'

const DARK_KEY = 'fotrino-films-darkmode'
export const darkModePref = ref(
  typeof LocalStorage !== 'undefined' && LocalStorage.getItem(DARK_KEY)
    ? LocalStorage.getItem(DARK_KEY)
    : 'auto'
)
export const systemDark = ref(
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
)

export const darkModeIcons = {
  light: 'far fa-sun',
  auto: 'fas fa-circle-half-stroke',
  dark: 'far fa-moon'
}

function applyDarkMode($q) {
  if (!$q || typeof $q.dark === 'undefined') return
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
  watch(darkModePref, val => {
    if (typeof LocalStorage !== 'undefined') {
      LocalStorage.set(DARK_KEY, val)
    }
    applyDarkMode($q)
  })

  onMounted(() => {
    applyDarkMode($q)
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', e => {
        systemDark.value = e.matches
        if (darkModePref.value === 'auto') applyDarkMode($q)
      })
    }
  })
  return {
    darkModePref,
    setDarkMode
  }
}
