<template>
  <q-btn-dropdown
    :icon="darkModeIcon"
    :label="$q.screen.gt.sm ? 'Theme' : ''"
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
        size="md"
        class="col-xs-12"
        @click="setDarkMode('dark')" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { darkModePref, darkModeIcons, setDarkMode } from '@utils/dark.js'

const $q = useQuasar()
const darkModeIcon = computed(() => darkModeIcons[darkModePref.value])
</script>
