<template>
  <div class="media-row">
    <ResourceActions
      :title="media.title"
      :image="media.preview"
      :pending="media.pending"
      :deleted="media.deleted"
      :link="getMediaLink('media', media.id)"
      :subtitle="media.created ? `Created: ${daysSince(media.created, true)}` : ''"
      delete-color="warning"
      @delete="$emit('deleteMedia', media.id)"
      square />
  </div>
</template>

<script setup>
import ResourceActions from './ResourceActions.vue'
import { daysSince } from '@utils/date.js'

defineProps({
  media: Object,
  project: Object,
  channel: Object,
  getMediaLink: Function
})

defineEmits(['deleteMedia'])
</script>
