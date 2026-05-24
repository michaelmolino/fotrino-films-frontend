<template>
  <q-btn
    icon="img:/icons/078f3904c20a921e06f8a2796ed0b538854c1b3572b5b95fd6fe16ec455bdb49-32x32.png"
    :label="buttonLabel"
    flat
    no-caps
    size="lg"
    to="/"
    aria-label="Fotrino Films home" />
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const buttonLabel = computed(() => ($q.screen.gt.xs ? 'Fotrino Films' : ''))
</script>
