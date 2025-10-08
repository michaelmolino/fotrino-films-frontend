<template>
  <q-expansion-item
    :label="project.title"
    :header-inset-level="0.5"
    :content-inset-level="1"
    group="projects"
    expand-icon-toggle
    expand-separator
    switch-toggle-side
    :disable="project.pending">
    <template #header>
      <ResourceActions
        :title="project.title"
        :image="project.poster"
        :color="project.poster_color || '#000000'"
        :pending="project.pending"
        :has-pending-children="hasPendingChildren"
        :link="getMediaLink('project', project.id)"
        @delete="$emit('deleteProject', project.id)" />
    </template>

    <MediaItem
      v-for="media in project.media"
      :key="media.id"
      :media="media"
      :project="project"
      :channel="channel"
      data-cy="media-item"
      :getMediaLink="getMediaLink"
      @deleteMedia="$emit('deleteMedia', $event)" />
  </q-expansion-item>
</template>

<script setup>
import { computed } from 'vue'
import ResourceActions from './ResourceActions.vue'
import MediaItem from './MediaItem.vue'

const props = defineProps({
  project: Object,
  channel: Object,
  getMediaLink: Function
})

defineEmits(['deleteProject', 'deleteMedia'])

const hasPendingChildren = computed(() => {
  return props.project.media?.some(media => media.pending) || false
})
</script>
