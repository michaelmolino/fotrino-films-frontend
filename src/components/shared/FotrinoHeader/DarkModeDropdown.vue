<template>
  <q-btn-dropdown
    :icon="darkModeIcon"
    :label="$q.screen.gt.sm ? 'Theme' : ''"
    size="md"
    flat
    no-caps>
    <div style="max-width:220px; margin: 0 auto; width: 100%;">
      <q-btn
        flat
        no-caps
        align="left"
        icon="far fa-sun"
        label="Light"
        size="md"
        @click="setDarkMode('light')"
      />
    </div>
    <div style="max-width:220px; margin: 0 auto; width: 100%;">
      <q-btn
        flat
        no-caps
        align="left"
        icon="fas fa-circle-half-stroke"
        label="System"
        size="md"
        @click="setDarkMode('auto')"
      />
    </div>
    <div style="max-width:220px; margin: 0 auto; width: 100%;">
      <q-btn
        flat
        no-caps
        align="left"
        icon="far fa-moon"
        label="Dark"
        size="md"
        @click="setDarkMode('dark')"
      />
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
</script>
