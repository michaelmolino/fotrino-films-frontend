import { ref, watch, onMounted } from 'vue'
import { LocalStorage } from 'quasar'

const DARK_KEY = 'fotrino-films-darkmode'

export const darkModePref = ref(LocalStorage.getItem(DARK_KEY) || 'auto')
export const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

export const darkModeIcons = {
  light: 'far fa-sun',
  auto: 'fas fa-circle-half-stroke',
  dark: 'far fa-moon'
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
  watch(darkModePref, val => {
    LocalStorage.set(DARK_KEY, val)
    applyDarkMode($q)
  })

  onMounted(() => {
    applyDarkMode($q)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', e => {
      systemDark.value = e.matches
      if (darkModePref.value === 'auto') applyDarkMode($q)
    })
  })

  return {
    darkModePref,
    setDarkMode
  }
}
