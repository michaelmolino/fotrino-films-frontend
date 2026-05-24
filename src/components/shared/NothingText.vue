<template>
  <div class="q-my-md full-width flex flex-center">
    <div class="row items-center no-wrap">
      <q-icon :name="resolvedIcon" size="sm" color="grey-5" class="q-mr-sm" />
      <span class="text-subtitle2 text-grey-6">{{ resolvedText }}</span>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, default: 'info' },
  text: { type: String, default: 'Nothing to see here.' }
})

const resolvedIcon = computed(() => props.icon || 'info')
const resolvedText = computed(() => props.text || 'Nothing to see here.')
</script>
