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
        @deleteChannel="deleteResource('channel', $event)"
        @undeleteChannel="undeleteChannel($event)"
        @deleteAlbum="deleteResource('album', $event)"
        @undeleteAlbum="undeleteAlbum($event)"
        @deleteMedia="deleteResource('media', $event)"
        @undeleteMedia="undeleteMedia($event)"
        @abortMedia="abortPendingMedia($event)"
        @editAlbum="saveAlbumEdit"
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
    album: {},
    media: {}
  }
}

function addChannelLink(links, channel) {
  if (channel?.id && !channel?.pending) {
    links.channel[channel.id] = `/c/${channel.publicId}/${channel.slug}`
  }
}

function addAlbumAndMediaLinks(links, album) {
  if (album?.id && !album?.pending) {
    links.album[album.id] = `/a/${album.publicId}/${album.slug}`
  }

  for (const media of album?.media || []) {
    if (media?.id && !media?.pending) {
      links.media[media.id] = `/m/${media.publicId}/${media.slug}`
    }
  }
}

const resourceLinks = computed(() => {
  const links = buildEmptyLinks()

  for (const channel of props.channels || []) {
    addChannelLink(links, channel)

    for (const album of channel?.albums || []) {
      addAlbumAndMediaLinks(links, album)
    }
  }

  return links
})

function getMediaLink(type, id) {
  if (!type || id == null) return null
  if (type === 'channel') return resourceLinks.value.channel[id] || null
  if (type === 'album') return resourceLinks.value.album[id] || null
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

async function undeleteMedia(mediaId) {
  try {
    await channelStore.undeleteResource({ type: 'media', id: mediaId })
    notifySuccess('Video restored.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to undelete this video.'), {
      timeout: 0
    })
  }
}

async function undeleteAlbum(albumId) {
  try {
    await channelStore.undeleteResource({ type: 'album', id: albumId })
    notifySuccess('Album restored.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to undelete this album.'), {
      timeout: 0
    })
  }
}

async function undeleteChannel(channelPublicId) {
  try {
    await channelStore.undeleteResource({ type: 'channel', id: channelPublicId })
    notifySuccess('Channel restored.')
  } catch (error) {
    notifyError(getComponentApiErrorMessage(error, 'Unable to undelete this channel.'), {
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
      const instruction = await upload.prepare(upload.preparePayload)
      if (!instruction?.objectName || instruction?.reference == null) {
        throw new Error('Invalid upload instruction returned by backend.')
      }
      const resourceType = instruction.resourceType || 'upload'

      // Use unified composable for upload orchestration
      initializeUppy({
        mediaId: instruction.reference,
        uploadEndpoint: '/api/upload',
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
      title: payload?.title,
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
        mediaId: payload?.id
      }
    },
    successMessage: 'Video updated.',
    errorMessage: 'Unable to update this video.'
  })
}

async function saveAlbumEdit(payload) {
  return runEditJourney({
    update: channelStore.updateAlbum,
    updatePayload: {
      albumId: payload?.id,
      title: payload?.title,
      subtitle: payload?.subtitle ?? null,
      posterType: payload?.posterType,
      posterColor: payload?.posterColor ?? null
    },
    upload: {
      shouldUpload: payload?.posterType === 'new' && !!payload?.posterFile,
      prepare: channelStore.requestAlbumPosterUpload,
      preparePayload: {
        albumId: payload?.id
      },
      file: payload?.posterFile,
      confirm: channelStore.confirmAlbumPosterUpload,
      confirmPayload: {
        albumId: payload?.id
      }
    },
    successMessage: 'Album updated.',
    errorMessage: 'Unable to update this album.'
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
        channelPublicId: payload?.channelPublicId
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
