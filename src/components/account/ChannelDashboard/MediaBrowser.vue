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
        @editMedia="saveMediaEdit"
        @editChannel="saveChannelEdit" />
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
import { uploadPresignedFileWithUppy } from '@libs/uppy-upload.js'

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

async function runEditJourney({
  updateAction,
  updatePayload,
  upload = null,
  successMessage,
  errorMessage
}) {
  try {
    if (upload?.shouldUpload) {
      const instruction = await store.dispatch(upload.prepareAction, upload.preparePayload)
      if (!instruction?.url || !instruction?.objectName) {
        throw new Error('Invalid upload instruction returned by backend.')
      }
      await uploadPresignedFileWithUppy({
        url: instruction.url,
        file: upload.file,
        resourceType: instruction.resourceType || 'upload'
      })
      // Confirm + metadata update atomically in one backend call
      await store.dispatch(upload.confirmAction, {
        ...upload.confirmPayload,
        ...updatePayload,
        objectName: instruction.objectName
      })
    } else {
      await store.dispatch(updateAction, updatePayload)
    }

    await store.dispatch('channel/getChannels', true)
    Notify.create({
      type: 'positive',
      message: successMessage,
      icon: 'check',
      timeout: 2000
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(error, errorMessage),
      icon: 'warning',
      timeout: 0
    })
  }
}

async function saveMediaEdit(payload) {
  return runEditJourney({
    updateAction: 'channel/updateMedia',
    updatePayload: {
      mediaId: payload?.id,
      description: payload?.description ?? null,
      resourceDate: payload?.resourceDate ?? null,
      main: !!payload?.main
    },
    upload: {
      shouldUpload: !!payload?.previewFile,
      prepareAction: 'channel/requestMediaPreviewUpload',
      preparePayload: {
        mediaId: payload?.id
      },
      file: payload?.previewFile,
      confirmAction: 'channel/confirmMediaPreviewUpload',
      confirmPayload: {
        mediaId: payload?.id,
      }
    },
    successMessage: 'Media updated.',
    errorMessage: 'Unable to update this media.'
  })
}

async function saveProjectEdit(payload) {
  return runEditJourney({
    updateAction: 'channel/updateProject',
    updatePayload: {
      projectId: payload?.id,
      subtitle: payload?.subtitle ?? null,
      posterType: payload?.posterType,
      posterColor: payload?.posterColor ?? null
    },
    upload: {
      shouldUpload: payload?.posterType === 'new' && !!payload?.posterFile,
      prepareAction: 'channel/requestProjectPosterUpload',
      preparePayload: {
        projectId: payload?.id
      },
      file: payload?.posterFile,
      confirmAction: 'channel/confirmProjectPosterUpload',
      confirmPayload: {
        projectId: payload?.id,
      }
    },
    successMessage: 'Project updated.',
    errorMessage: 'Unable to update this project.'
  })
}

async function saveChannelEdit(payload) {
  return runEditJourney({
    updateAction: 'channel/updateChannel',
    updatePayload: {
      channelUuid: payload?.channelUuid,
      title: payload?.title
    },
    upload: {
      shouldUpload: !!payload?.coverFile,
      prepareAction: 'channel/requestChannelCoverUpload',
      preparePayload: {
        channelUuid: payload?.channelUuid
      },
      file: payload?.coverFile,
      confirmAction: 'channel/confirmChannelCoverUpload',
      confirmPayload: {
        channelUuid: payload?.channelUuid,
      }
    },
    successMessage: 'Channel updated.',
    errorMessage: 'Unable to update this channel.'
  })
}
</script>

<style scoped>
.media-browser.admin-tree {
  max-width: 800px;
  width: 100%;
  overflow-x: hidden;
}
</style>
