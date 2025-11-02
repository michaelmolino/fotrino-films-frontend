<template>
  <q-btn-dropdown
    :icon="darkModeIcon"
    :label="$q.screen.gt.sm ? 'Theme' : ''"
    aria-label="Select theme preference"
    size="md"
    flat
    no-caps>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        flat
        no-caps
        align="left"
        :icon="darkModeIcons.light"
        label="Light"
        aria-label="Switch to light theme"
        size="md"
        class="col-xs-12"
        @click="setDarkMode('light')" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        flat
        no-caps
        align="left"
        :icon="darkModeIcons.auto"
        label="System"
        aria-label="Use system theme preference"
        size="md"
        class="col-xs-12"
        @click="setDarkMode('auto')" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        flat
        no-caps
        align="left"
        :icon="darkModeIcons.dark"
        label="Dark"
        aria-label="Switch to dark theme"
        size="md"
        class="col-xs-12"
        @click="setDarkMode('dark')" />
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
