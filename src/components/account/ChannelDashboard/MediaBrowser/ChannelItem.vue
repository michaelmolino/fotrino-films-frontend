<template>
  <q-expansion-item
    :label="channel.title"
    group="channels"
    expand-icon-toggle
    expand-separator
    switch-toggle-side
    :disable="channel.pending">
    <template #header>
      <ResourceActions
        :title="channel.title"
        :image="channel.cover"
        :pending="channel.pending"
        :deleted="channel.deleted"
        :hasPending-children="hasPendingChildren"
        :link="getMediaLink('channel', channel.id)"
        :avatarSize="'48px'"
        :badge="channel.is_admin"
        badgeIcon="security"
        :subtitle="channel.created ? `Created: ${daysSince(channel.created, true)}` : ''"
        @delete="$emit('deleteChannel', channel.uuid)" />
    </template>

    <ProjectItem
      v-for="project in channel.projects"
      :key="project.id"
      :project="project"
      :channel="channel"
      data-cy="project-item"
      @deleteProject="$emit('deleteProject', $event)"
      @deleteMedia="$emit('deleteMedia', $event)"
      :getMediaLink="getMediaLink" />
  </q-expansion-item>
</template>

<script setup>
import { computed } from 'vue'
import ResourceActions from './ResourceActions.vue'
import ProjectItem from './ProjectItem.vue'
import { daysSince } from '@utils/date.js'

const props = defineProps({
  channel: Object,
  getMediaLink: Function
})

defineEmits(['deleteChannel', 'deleteProject', 'deleteMedia'])

const hasPendingChildren = computed(() => {
  if (props.channel.projects?.some(project => project.pending)) {
    return true
  }
  return (
    props.channel.projects?.some(project => project.media?.some(media => media.pending)) || false
  )
})
</script>
