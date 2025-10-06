<template>
  <div class="q-my-md full-width flex flex-center">
    <div class="row items-center no-wrap">
      <q-icon :name="icon" size="sm" color="grey-5" class="q-mr-sm" />
      <span class="text-subtitle2 text-grey-6">{{ text }}</span>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'fas fa-circle-info' },
  text: { type: String, default: 'Nothing to see here.' }
})
</script>
