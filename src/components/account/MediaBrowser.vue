<template>
  <div class="media-browser">
    <q-list bordered class="rounded-borders">
      <ChannelItem
        v-for="channel in channels"
        :key="channel.uuid"
        :channel="channel"
        :getMediaLink="getMediaLink"
        @deleteChannel="deleteResource('channel', $event)"
        @deleteProject="deleteResource('project', $event)"
        @deleteMedia="deleteResource('media', $event)"
      />
    </q-list>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import ChannelItem from './MediaBrowser/ChannelItem.vue'

defineOptions({ name: 'MediaBrowser' })

const store = useStore()
const props = defineProps({
  channels: { type: Array, default: () => [] }
})

function getMediaLink(type, id) {
  const channels = props.channels || []
  if (type === 'channel') {
    return getChannelLink(channels, id)
  }
  if (type === 'project') {
    return getProjectLink(channels, id)
  }
  if (type === 'media') {
    return getMediaItemLink(channels, id)
  }
  return null
}

function getChannelLink(channels, id) {
  const ch = channels.find(c => c.id === id)
  return ch && !ch.pending ? `/${[ch.uuid, ch.slug].join('/')}` : null
}

function getProjectLink(channels, id) {
  for (const ch of channels) {
    const projects = ch.projects || []
    const project = projects.find(p => p.id === id)
    if (project && !project.pending) {
      return `/${[ch.uuid, ch.slug, project.slug].join('/')}`
    }
  }
  return null
}

function getMediaItemLink(channels, id) {
  for (const ch of channels) {
    const projects = ch.projects || []
    for (const project of projects) {
      const media = (project.media || []).find(m => m.id === id)
      if (media && !media.pending) {
        return `/${[ch.uuid, ch.slug, project.slug, media.slug].join('/')}`
      }
    }
  }
  return null
}

function deleteResource(type, id) {
  store.dispatch('channel/deleteResource', { type, id })
}
</script>

<style scoped>
.media-browser {
  max-width: 480px;
  width: 100%;
  overflow-x: hidden;
}
</style>
