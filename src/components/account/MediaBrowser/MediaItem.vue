<template>
  <div class="media-row">
    <ResourceActions
      :title="media.title"
      :image="media.preview"
      :pending="media.pending"
      :link="getMediaLink('media', media.id)"
      delete-color="warning"
      @delete="$emit('deleteMedia', media.id)"
      square />
  </div>
</template>

<script setup>
import ResourceActions from './ResourceActions.vue'

defineOptions({ name: 'MediaItem' })

defineProps({
  media: Object,
  project: Object,
  channel: Object,
  getMediaLink: Function
})

defineEmits(['deleteMedia'])
</script>
