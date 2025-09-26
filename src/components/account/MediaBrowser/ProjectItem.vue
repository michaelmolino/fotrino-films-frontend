<template>
  <q-expansion-item
    :label="project.title"
    :header-inset-level="0.5"
    :content-inset-level="1"
    group="projects"
    expand-icon-toggle
    expand-separator
    switch-toggle-side
    :disable="project.pending"
  >
    <template #header>
      <ResourceActions
        :title="project.title"
        :image="project.poster"
        :pending="project.pending"
        :link="getMediaLink('project', project.id)"
        @delete="$emit('deleteProject', project.id)"
      />
    </template>

    <MediaItem
      v-for="media in project.media"
      :key="media.id"
      :media="media"
      :project="project"
      :channel="channel"
      :getMediaLink="getMediaLink"
      @deleteMedia="$emit('deleteMedia', $event)"
    />
  </q-expansion-item>
</template>

<script setup>
import ResourceActions from './ResourceActions.vue'
import MediaItem from './MediaItem.vue'

defineOptions({ name: 'ProjectItem' })

defineProps({
  project: Object,
  channel: Object,
  getMediaLink: Function
})

defineEmits(['deleteProject', 'deleteMedia'])
</script>
