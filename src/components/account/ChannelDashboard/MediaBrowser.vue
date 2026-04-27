<template>
  <div class="media-browser admin-tree q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-md">Your Channels & Media</div>
    <q-list bordered class="rounded-borders">
      <ChannelItem
        v-for="channel in channels"
        :key="channel.uuid"
        :channel="channel"
        :getMediaLink="getMediaLink"
        data-cy="channel-item"
        @deleteChannel="deleteResource('channel', $event)"
        @deleteProject="deleteResource('project', $event)"
        @deleteMedia="deleteResource('media', $event)"
        @editProject="saveProjectEdit"
        @editMedia="saveMediaEdit" />
    </q-list>
    <div v-if="channels.length === 0" class="q-pa-md text-grey-6 text-center">
      No channels found
    </div>
  </div>
</template>

<script setup>
import { Notify } from 'quasar'
import { useStore } from 'vuex'
import ChannelItem from './MediaBrowser/ChannelItem.vue'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'

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

async function deleteResource(type, id) {
  try {
    const deleted = await store.dispatch('channel/deleteResource', { type, id })
    if (deleted === false) return
    Notify.create({
      type: 'positive',
      message: 'Deletion queued.',
      icon: 'check',
      timeout: 2000
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(error, 'Unable to delete this resource.'),
      icon: 'warning',
      timeout: 0
    })
  }
}

async function saveMediaEdit(payload) {
  try {
    await store.dispatch('channel/updateMedia', {
      mediaId: payload?.id,
      description: payload?.description ?? null,
      resourceDate: payload?.resourceDate ?? null,
      main: !!payload?.main
    })

    if (payload?.previewFile) {
      const instruction = await store.dispatch('channel/requestMediaPreviewUpload', {
        mediaId: payload?.id
      })
      await store.dispatch('channel/uploadMediaPreviewBinary', {
        url: instruction.url,
        file: payload.previewFile
      })
      await store.dispatch('channel/confirmMediaPreviewUpload', {
        mediaId: payload?.id,
        objectName: instruction.objectName
      })
    }

    await store.dispatch('channel/getChannels', true)
    Notify.create({
      type: 'positive',
      message: 'Media updated.',
      icon: 'check',
      timeout: 2000
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(error, 'Unable to update this media.'),
      icon: 'warning',
      timeout: 0
    })
  }
}

async function saveProjectEdit(payload) {
  try {
    await store.dispatch('channel/updateProject', {
      projectId: payload?.id,
      subtitle: payload?.subtitle ?? null,
      posterType: payload?.posterType,
      posterColor: payload?.posterColor ?? null
    })

    if (payload?.posterType === 'new' && payload?.posterFile) {
      const instruction = await store.dispatch('channel/requestProjectPosterUpload', {
        projectId: payload?.id
      })
      await store.dispatch('channel/uploadMediaPreviewBinary', {
        url: instruction.url,
        file: payload.posterFile
      })
      await store.dispatch('channel/confirmProjectPosterUpload', {
        projectId: payload?.id,
        objectName: instruction.objectName
      })
    }

    await store.dispatch('channel/getChannels', true)
    Notify.create({
      type: 'positive',
      message: 'Project updated.',
      icon: 'check',
      timeout: 2000
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(error, 'Unable to update this project.'),
      icon: 'warning',
      timeout: 0
    })
  }
}
</script>

<style scoped>
.media-browser.admin-tree {
  max-width: 800px;
  width: 100%;
  overflow-x: hidden;
}
</style>
