<template>
  <q-btn-dropdown
    :icon="darkModeIcon"
    :label="$q.screen.gt.sm ? 'Theme' : ''"
    size="md"
    flat
    no-caps>
    <q-separator />
    <q-btn
      flat
      no-caps
      align="left"
      icon="far fa-sun"
      label="Light"
      size="md"
      class="fit"
      @click="setDarkMode('light')" />
    <q-separator />
    <q-btn
      flat
      no-caps
      align="left"
      icon="fas fa-circle-half-stroke"
      label="System"
      size="md"
      class="fit"
      @click="setDarkMode('auto')" />
    <q-separator />
    <q-btn
      flat
      no-caps
      align="left"
      icon="far fa-moon"
      label="Dark"
      size="md"
      class="fit"
      @click="setDarkMode('dark')" />
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
