<template>
  <div class="media-browser admin-tree q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-md">Your Channels & Videos</div>
    <q-list bordered class="rounded-borders">
      <ChannelItem
        v-for="channel in channels"
        :key="channel.publicId"
        :channel="channel"
        :getMediaLink="getMediaLink"
        data-cy="channel-item"
        v-on="channelItemListeners" />
    </q-list>
    <div v-if="showEmptyState" class="q-pa-md text-grey-6 text-center">No channels found</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useUploadStore } from 'src/stores/upload-store.js'
import ChannelItem from './MediaBrowser/ChannelItem.vue'
import { getComponentApiErrorMessage } from 'src/utils/api-error-service.js'
import { useUppyPresignedUpload } from 'src/composables/useUppyPresignedUpload.js'
import { notifyError, notifySuccess } from 'src/utils/notify.js'

const channelStore = useChannelStore()
const uploadStore = useUploadStore()
const props = defineProps({
  channels: { type: Array, default: () => [] }
})

const showEmptyState = computed(() => props.channels.length === 0)

const channelItemListeners = {
  deleteChannel: channelPublicId =>
    deleteResource('channel', { channelPublicId, publicId: channelPublicId }),
  undeleteChannel,
  deleteAlbum: value => deleteResource('album', value),
  undeleteAlbum,
  deleteMedia: value => deleteResource('media', value),
  undeleteMedia,
  abortMedia: abortPendingMedia,
  editAlbum: saveAlbumEdit,
  editMedia: saveMediaEdit,
  editChannel: saveChannelEdit
}

const channelLinks = computed(() => {
  const links = {}

  for (const channel of props.channels) {
    if (channel.publicId && !channel.pending) {
      links[channel.publicId] = channel.canonicalPath.publicPath
    }
  }

  return links
})

function getMediaLink(type, resourceOrId) {
  if (!type || resourceOrId == null) return null

  const resource = typeof resourceOrId === 'object' && resourceOrId !== null ? resourceOrId : null
  const resourcePath =
    resource && !resource.pending && resource.canonicalPath
      ? resource.canonicalPath.publicPath
      : null
  if (resourcePath) return resourcePath

  const id = resource?.privateId || resource?.publicId || resourceOrId
  if (id == null) return null
  if (type === 'channel') return channelLinks.value[id]
  return null
}

async function deleteResource(type, resource) {
  try {
    const result = await channelStore.deleteResource({ type, ...resource })
    if (result?.cancelled || result?.ok === false) return
    notifySuccess('Deletion queued.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to delete this resource.'), {
      timeout: 0
    })
  }
}

async function undeleteMedia({ channelPublicId, privateId, publicId }) {
  try {
    await channelStore.undeleteResource({ type: 'media', channelPublicId, privateId, publicId })
    notifySuccess('Video restored.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to undelete this video.'), {
      timeout: 0
    })
  }
}

async function undeleteAlbum({ channelPublicId, privateId, publicId }) {
  try {
    await channelStore.undeleteResource({ type: 'album', channelPublicId, privateId, publicId })
    notifySuccess('Album restored.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to undelete this album.'), {
      timeout: 0
    })
  }
}

async function undeleteChannel(channelPublicId) {
  try {
    await channelStore.undeleteResource({
      type: 'channel',
      channelPublicId,
      publicId: channelPublicId
    })
    notifySuccess('Channel restored.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to undelete this channel.'), {
      timeout: 0
    })
  }
}

async function abortPendingMedia(mediaPrivateId) {
  try {
    await uploadStore.abortUpload(mediaPrivateId)
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

const { initializeUppy, addFilesToUppy, startUpload, cleanup } = useUppyPresignedUpload()

async function runEditJourney({
  update,
  updatePayload,
  upload = null,
  successMessage,
  errorMessage
}) {
  try {
    if (upload?.shouldUpload) {
      const prepareResult = await upload.prepare(upload.preparePayload)
      const instruction = prepareResult?.data
      if (!instruction?.objectName || instruction?.reference == null) {
        throw new Error('Invalid upload instruction returned by backend.')
      }
      const resourceType = instruction.resourceType || 'upload'

      // Use unified composable for upload orchestration
      initializeUppy({
        mediaPrivateId: instruction.reference,
        uploadEndpoint: '/uppy',
        instructions: [
          {
            resourceType,
            reference: instruction.reference,
            url: instruction.url || ''
          }
        ]
      })
      addFilesToUppy([{ file: upload.file, resourceType }])
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

    notifySuccess(successMessage)
    return true
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, errorMessage), { timeout: 0 })
    return false
  }
}

async function saveMediaEdit(payload) {
  const success = await runEditJourney({
    update: channelStore.updateMedia,
    updatePayload: {
      channelPublicId: payload?.channelPublicId,
      mediaPrivateId: payload?.privateId,
      mediaPublicId: payload?.publicId,
      title: payload?.title,
      description: payload?.description ?? null,
      resourceDate: payload?.resourceDate ?? null,
      main: !!payload?.main
    },
    upload: {
      shouldUpload: !!payload?.previewFile,
      prepare: uploadStore.requestMediaPreviewUpload,
      preparePayload: {
        mediaPrivateId: payload?.privateId
      },
      file: payload?.previewFile,
      confirm: uploadStore.confirmMediaPreviewUpload,
      confirmPayload: {
        mediaPrivateId: payload?.privateId,
        mediaPublicId: payload?.publicId
      }
    },
    successMessage: 'Video updated.',
    errorMessage: 'Unable to update this video.'
  })
  if (success) payload?.resolve?.()
  else payload?.reject?.()
}

async function saveAlbumEdit(payload) {
  const success = await runEditJourney({
    update: channelStore.updateAlbum,
    updatePayload: {
      channelPublicId: payload?.channelPublicId,
      albumPrivateId: payload?.privateId,
      albumPublicId: payload?.publicId,
      title: payload?.title,
      subtitle: payload?.subtitle ?? null,
      posterType: payload?.posterType,
      posterColor: payload?.posterColor ?? null
    },
    upload: {
      shouldUpload: payload?.posterType === 'new' && !!payload?.posterFile,
      prepare: uploadStore.requestAlbumPosterUpload,
      preparePayload: {
        albumPrivateId: payload?.privateId
      },
      file: payload?.posterFile,
      confirm: uploadStore.confirmAlbumPosterUpload,
      confirmPayload: {
        albumPrivateId: payload?.privateId,
        albumPublicId: payload?.publicId
      }
    },
    successMessage: 'Album updated.',
    errorMessage: 'Unable to update this album.'
  })
  if (success) payload?.resolve?.()
  else payload?.reject?.()
}

async function saveChannelEdit(payload) {
  const success = await runEditJourney({
    update: channelStore.updateChannel,
    updatePayload: {
      channelPublicId: payload?.channelPublicId,
      title: payload?.title
    },
    upload: {
      shouldUpload: !!payload?.coverFile,
      prepare: uploadStore.requestChannelCoverUpload,
      preparePayload: {
        channelPublicId: payload?.channelPublicId
      },
      file: payload?.coverFile,
      confirm: uploadStore.confirmChannelCoverUpload,
      confirmPayload: {
        channelPublicId: payload?.channelPublicId
      }
    },
    successMessage: 'Channel updated.',
    errorMessage: 'Unable to update this channel.'
  })
  if (success) payload?.resolve?.()
  else payload?.reject?.()
}
</script>

<style scoped>
.media-browser.admin-tree {
  max-width: 800px;
  width: 100%;
  overflow-x: hidden;
}
</style>
