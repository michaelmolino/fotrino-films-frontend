<template>
  <q-btn
    icon="play_circle"
    :label="buttonLabel"
    flat
    no-caps
    size="lg"
    to="/"
    aria-label="Fotrino Films home">
    <q-tooltip v-if="showTooltip">Home</q-tooltip>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const buttonLabel = computed(() => ($q.screen.gt.xs ? 'Fotrino Films' : ''))
const showTooltip = computed(() => !$q.screen.gt.xs)
</script>
