<template>
  <div class="media-browser admin-tree q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-md">Your Channels & Media</div>
    <q-list bordered class="rounded-borders">
      <ChannelItem
        v-for="channel in channels"
        :key="channel.publicId"
        :channel="channel"
        :getMediaLink="getMediaLink"
        data-cy="channel-item"
        @deleteChannel="deleteResource('channel', $event)"
        @deleteProject="deleteResource('project', $event)"
        @deleteMedia="deleteResource('media', $event)"
        @abortMedia="abortPendingMedia($event)"
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
import { computed } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import ChannelItem from './MediaBrowser/ChannelItem.vue'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'
import { useUppyPresignedUpload } from 'src/composables/useUppyPresignedUpload.js'
import { isPendingUploadLockedByAnotherTab } from '@utils/pendingUploadLocks.js'
import { notifyError, notifySuccess, notifyWarning } from 'src/utils/notify.js'

const channelStore = useChannelStore()
const props = defineProps({
  channels: { type: Array, default: () => [] }
})

function buildEmptyLinks() {
  return {
    channel: {},
    project: {},
    media: {}
  }
}

function addChannelLink(links, channel) {
  if (channel?.id && !channel?.pending) {
    links.channel[channel.id] = `/c/${channel.publicId}/${channel.slug}`
  }
}

function addProjectAndMediaLinks(links, project) {
  if (project?.id && !project?.pending) {
    links.project[project.id] = `/p/${project.publicId}/${project.slug}`
  }

  for (const media of project?.media || []) {
    if (media?.id && !media?.pending) {
      links.media[media.id] = `/m/${media.publicId}/${media.slug}`
    }
  }
}

const resourceLinks = computed(() => {
  const links = buildEmptyLinks()

  for (const channel of props.channels || []) {
    addChannelLink(links, channel)

    for (const project of channel?.projects || []) {
      addProjectAndMediaLinks(links, project)
    }
  }

  return links
})

function getMediaLink(type, id) {
  if (!type || id == null) return null
  if (type === 'channel') return resourceLinks.value.channel[id] || null
  if (type === 'project') return resourceLinks.value.project[id] || null
  if (type === 'media') return resourceLinks.value.media[id] || null
  return null
}

async function deleteResource(type, id) {
  try {
    const deleted = await channelStore.deleteResource({ type, id })
    if (deleted === false) return
    notifySuccess('Deletion queued.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to delete this resource.'), {
      timeout: 0
    })
  }
}

async function abortPendingMedia(mediaId) {
  if (isPendingUploadLockedByAnotherTab(mediaId)) {
    notifyWarning('This upload is currently active in another tab. Cancel there first.', {
      timeout: 3500
    })
    return
  }

  try {
    await channelStore.abortUpload(mediaId)
    await channelStore.loadChannels(true)
    notifySuccess('Pending upload aborted.')
  } catch (error) {
    if (error?.__userCancelled || error?.code === 'ERR_CANCELED') {
      return
    }
    notifyError(getComponentApiErrorMessage(error, 'Unable to abort this pending upload.'), {
      timeout: 0
    })
  }
}

const {
  initializeUppy,
  addFilesToUppy,
  startUpload,
  cleanup
} = useUppyPresignedUpload()

async function runEditJourney({
  update,
  updatePayload,
  upload = null,
  successMessage,
  errorMessage
}) {
  try {
    if (upload?.shouldUpload) {
      const instruction = await upload.prepare(upload.preparePayload)
      if (!instruction?.url || !instruction?.objectName) {
        throw new Error('Invalid upload instruction returned by backend.')
      }
      // Use unified composable for upload orchestration
      initializeUppy([{ resourceType: instruction.resourceType || 'upload', url: instruction.url }])
      addFilesToUppy([{ file: upload.file, resourceType: instruction.resourceType || 'upload' }])
      await startUpload()
      cleanup()
      // Confirm + metadata update atomically in one backend call
      await upload.confirm({
        ...upload.confirmPayload,
        ...updatePayload,
        objectName: instruction.objectName
      })
    } else {
      await update(updatePayload)
    }

    await channelStore.loadChannels(true)
    notifySuccess(successMessage)
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, errorMessage), { timeout: 0 })
  }
}

async function saveMediaEdit(payload) {
  return runEditJourney({
    update: channelStore.updateMedia,
    updatePayload: {
      mediaId: payload?.id,
      description: payload?.description ?? null,
      resourceDate: payload?.resourceDate ?? null,
      main: !!payload?.main
    },
    upload: {
      shouldUpload: !!payload?.previewFile,
      prepare: channelStore.requestMediaPreviewUpload,
      preparePayload: {
        mediaId: payload?.id
      },
      file: payload?.previewFile,
      confirm: channelStore.confirmMediaPreviewUpload,
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
    update: channelStore.updateProject,
    updatePayload: {
      projectId: payload?.id,
      subtitle: payload?.subtitle ?? null,
      posterType: payload?.posterType,
      posterColor: payload?.posterColor ?? null
    },
    upload: {
      shouldUpload: payload?.posterType === 'new' && !!payload?.posterFile,
      prepare: channelStore.requestProjectPosterUpload,
      preparePayload: {
        projectId: payload?.id
      },
      file: payload?.posterFile,
      confirm: channelStore.confirmProjectPosterUpload,
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
    update: channelStore.updateChannel,
    updatePayload: {
      channelPublicId: payload?.channelPublicId,
      title: payload?.title
    },
    upload: {
      shouldUpload: !!payload?.coverFile,
      prepare: channelStore.requestChannelCoverUpload,
      preparePayload: {
        channelPublicId: payload?.channelPublicId
      },
      file: payload?.coverFile,
      confirm: channelStore.confirmChannelCoverUpload,
      confirmPayload: {
        channelPublicId: payload?.channelPublicId,
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
