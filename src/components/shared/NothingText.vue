<template>
  <div class="q-py-md flex items-center">
    <q-icon :name="icon" class="q-px-sm" />
    <span>{{ text }}</span>
  </div>
</template>

<script setup>
defineOptions({ name: 'NothingText' })

defineProps({
  icon: { type: String, default: 'fas fa-circle-info' },
  text: { type: String, default: 'Nothing to see here.' }
})
</script>
