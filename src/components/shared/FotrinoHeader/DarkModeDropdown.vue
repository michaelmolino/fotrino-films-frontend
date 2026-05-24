<template>
  <q-btn-dropdown
    :icon="darkModeIcon"
    :label="buttonLabel"
    aria-label="Select theme preference"
    size="md"
    flat
    no-caps>
    <div v-for="option in themeOptions" :key="option.mode" class="theme-row row">
      <q-btn
        flat
        no-caps
        align="left"
        :icon="option.icon"
        :label="option.label"
        :aria-label="option.ariaLabel"
        size="md"
        class="col-xs-12"
        @click="setDarkMode(option.mode)" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useDarkMode, darkModeIcons, setDarkMode } from '@utils/dark.js'

const $q = useQuasar()
const { darkModePref } = useDarkMode($q)
const darkModeIcon = computed(() => darkModeIcons[darkModePref.value])
const buttonLabel = computed(() => ($q.screen.gt.sm ? 'Theme' : ''))
const themeOptions = computed(() => [
  {
    mode: 'light',
    icon: darkModeIcons.light,
    label: 'Light',
    ariaLabel: 'Switch to light theme'
  },
  {
    mode: 'auto',
    icon: darkModeIcons.auto,
    label: 'System',
    ariaLabel: 'Use system theme preference'
  },
  {
    mode: 'dark',
    icon: darkModeIcons.dark,
    label: 'Dark',
    ariaLabel: 'Switch to dark theme'
  }
])
</script>

<style scoped>
.theme-row {
  max-width: 220px;
  margin: 0 auto;
  width: 100%;
}
</style>
