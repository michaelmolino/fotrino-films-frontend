<template>
  <q-expansion-item
    :label="channel.title"
    group="channels"
    expand-icon-toggle
    expand-separator
    switch-toggle-side
    :disable="channel.pending"
  >
    <template #header>
      <ResourceActions
        :title="channel.title"
        :image="channel.cover"
        :pending="channel.pending"
        :link="getMediaLink('channel', channel.id)"
        @delete="$emit('deleteChannel', channel.uuid)"
      />
    </template>

    <ProjectItem
      v-for="project in channel.projects"
      :key="project.id"
      :project="project"
      :channel="channel"
      @deleteProject="$emit('deleteProject', $event)"
      @deleteMedia="$emit('deleteMedia', $event)"
      :getMediaLink="getMediaLink"
    />
  </q-expansion-item>
</template>

<script setup>
import ResourceActions from './ResourceActions.vue'
import ProjectItem from './ProjectItem.vue'

defineOptions({ name: 'ChannelItem' })

defineProps({
  channel: Object,
  getMediaLink: Function
})

defineEmits(['deleteChannel', 'deleteProject', 'deleteMedia'])
</script>
