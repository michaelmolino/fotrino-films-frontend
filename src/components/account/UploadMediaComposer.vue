<template>
  <div v-if="contentState !== 'auth-required'" class="q-pa-md" data-cy="upload-page-composer">
    <q-item class="q-pb-md">
      <q-item-section>
        <q-item-label class="text-h5">Upload Video</q-item-label>
      </q-item-section>
    </q-item>

    <q-banner
      v-if="contentState === 'verification-pending'"
      rounded
      class="bg-orange-1 text-orange-10 q-pa-md"
      data-cy="upload-verification-pending-message">
      Uploads are currently disabled pending account verification, which usually happens within 24
      hours.
    </q-banner>

    <template v-else>
      <template v-if="contentState === 'editing'">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">Select Video</div>
            <q-file
              label="Video *"
              outlined
              :model-value="mediaFile"
              accept="video/*"
              color="accent"
              data-cy="upload-media-file"
              @update:model-value="onComposerMediaFileUpdate"
              @rejected="onMediaFileRejected">
              <template v-slot:prepend>
                <q-icon name="movie" @click.stop.prevent />
              </template>
              <template v-slot:append>
                <q-icon
                  name="close"
                  @click.stop.prevent="onComposerMediaFileUpdate(null)"
                  class="cursor-pointer" />
              </template>
            </q-file>
          </q-card-section>
        </q-card>

        <div class="composer-grid">
          <div class="composer-summary-card q-pa-sm">
            <Summary
              :media="media"
              :album="album"
              :upload-phase="uploadPhase"
              :has-summary-description="hasSummaryDescription"
              :summary-description-html="summaryDescriptionHtml"
              :is-video-summary-ready="isVideoSummaryReady"
              :video-check-color="videoCheckColor"
              :icon-color-on-surface="iconColorOnSurface"
              :video-completion-source="videoCompletionSource"
              :is-channel-summary-ready="isChannelSummaryReady"
              :channel-summary-avatar-src="channelSummaryAvatarSrc"
              :channel-summary-label="channelSummaryLabel"
              :channel-completion-source="channelCompletionSource"
              :is-album-summary-ready="isAlbumSummaryReady"
              :album-summary-poster-src="albumSummaryPosterSrc"
              :album-summary-poster-color="albumSummaryPosterColor"
              :album-summary-label="albumSummaryLabel"
              :album-summary-subtitle="albumSummarySubtitle"
              :album-completion-source="albumCompletionSource"
              :badge-color-defaulted="badgeColorDefaulted"
              :badge-color-custom="badgeColorCustom"
              :captured-summary-label="capturedSummaryLabel" />
          </div>

          <div class="composer-details-pane">
            <VideoExpansionItem
              :active-section="activeSection"
              :media-file="mediaFile"
              :expansion-header-class="expansionHeaderClass"
              :input-color="inputColor"
              :payload="payload"
              :preview-file="previewFile"
              :composer-preview-image="composerPreviewImage"
              :is-preview-processing="isPreviewProcessing"
              :flat-accent-btn-style="flatAccentBtnStyle"
              @section-toggle="onVideoSectionToggle"
              @media-title-update="onComposerMediaTitleUpdate"
              @media-description-update="onComposerMediaDescriptionUpdate"
              @media-resource-date-update="onComposerMediaResourceDateUpdate"
              @media-main-update="onComposerMediaMainUpdate"
              @preview-type-update="onComposerPreviewTypeUpdate"
              @media-preview-update="onComposerMediaPreviewUpdate"
              @media-refresh="onComposerMediaRefresh" />

            <ChannelExpansionItem
              :active-section="activeSection"
              :media-file="mediaFile"
              :expansion-header-class="expansionHeaderClass"
              :input-color="inputColor"
              :payload="payload"
              :channels="channels"
              :cover-file="coverFile"
              :channel-editor-cover-src="channelEditorCoverSrc"
              @section-toggle="onChannelSectionToggle"
              @select-existing-channel="onComposerSelectExistingChannel"
              @select-new-channel-card="onComposerSelectNewChannelCard"
              @channel-title-update="onComposerChannelTitleUpdate"
              @restore-default-channel-title="restoreDefaultChannelTitle"
              @channel-cover-type-update="onComposerChannelCoverTypeUpdate"
              @channel-cover-file-update="onComposerChannelCoverFileUpdate" />

            <ProjectExpansionItem
              :active-section="activeSection"
              :media-file="mediaFile"
              :expansion-header-class="expansionHeaderClass"
              :input-color="inputColor"
              :payload="payload"
              :albums="albums"
              :poster-file="posterFile"
              :album-editor-preview="albumEditorPreview"
              :flat-accent-btn-style="flatAccentBtnStyle"
              :album-color-dialog="albumColorDialog"
              @section-toggle="onAlbumSectionToggle"
              @select-existing-album="onComposerSelectExistingAlbum"
              @select-new-album-card="onComposerSelectNewAlbumCard"
              @album-title-update="onComposerAlbumTitleUpdate"
              @restore-default-album-title="restoreDefaultAlbumTitle"
              @album-subtitle-update="onComposerAlbumSubtitleUpdate"
              @album-poster-type-update="onComposerAlbumPosterTypeUpdate"
              @album-poster-file-update="onComposerAlbumPosterFileUpdate"
              @album-poster-color-update="onComposerAlbumPosterColorUpdate"
              @update:album-color-dialog="onAlbumColorDialogUpdate" />
          </div>

          <q-card flat bordered class="composer-actions-card">
            <q-card-section>
              <div class="row q-col-gutter-sm items-center">
                <div class="col-auto" v-if="uploadPhase === 'editing'">
                  <q-btn
                    color="primary"
                    icon="cloud_upload"
                    label="Upload Now"
                    data-cy="upload-submit-button"
                    :disable="!isReadyToUpload"
                    @click="startUploadJourney" />
                </div>
                <div class="col-auto" v-if="uploadPhase === 'uploading' && isUploading">
                  <q-btn flat icon="cancel" color="negative" label="Cancel" @click="cancelUpload" />
                </div>
                <div class="col-auto" v-if="uploadPhase === 'uploading' && !isUploading">
                  <q-btn flat icon="refresh" label="Retry Upload" @click="startUploadJourney" />
                </div>
                <div class="col-auto" v-if="uploadPhase === 'complete'">
                  <q-btn flat icon="add" label="Start Another Upload" @click="resetUploadFlow" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>

      <ProgressView
        v-else
        :upload-phase="uploadPhase"
        :payload="payload"
        :media="media"
        :album="album"
        :progress="progress"
        :status-text="statusText"
        :is-uploading="isUploading"
        @cancel-upload="cancelUpload"
        @start-upload-journey="startUploadJourney" />
    </template>
  </div>
  <AuthRequired v-else type="login" message="Please log in to upload videos." />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import AuthRequired from '@components/shared/AuthRequired.vue'
import Summary from '@components/account/UploadMediaComposer/Summary.vue'
import VideoExpansionItem from '@components/account/UploadMediaComposer/VideoExpansionItem.vue'
import ChannelExpansionItem from '@components/account/UploadMediaComposer/ChannelExpansionItem.vue'
import ProjectExpansionItem from '@components/account/UploadMediaComposer/ProjectExpansionItem.vue'
import ProgressView from '@components/account/UploadMediaComposer/ProgressView.vue'
import { useUploadMediaForm } from '@composables/useUploadMediaForm.js'
import { daysSince } from '@utils/date.js'
import { sanitizeHtml, sanitizeText } from '@utils/text.js'

const $q = useQuasar()
const activeSection = ref(null)
const mediaUserModified = ref(false)
const videoWasReady = ref(false)
const albumColorDialog = ref(false)
const inputColor = computed(() => ($q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'))
const expansionHeaderClass = computed(() => ($q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2'))
const iconColorOnSurface = computed(() => ($q.dark.isActive ? 'grey-4' : 'dark'))
const badgeColorDefaulted = computed(() => ($q.dark.isActive ? 'blue-grey-3' : 'blue-grey-6'))
const badgeColorCustom = computed(() => ($q.dark.isActive ? 'green-4' : 'positive'))
const flatAccentBtnStyle = computed(() =>
  $q.dark.isActive ? { background: 'rgba(255, 248, 220, 0.88)', borderRadius: '4px' } : undefined
)

const {
  payload,
  profile,
  isNewUserProfile,
  channels,
  albums,
  album,
  media,
  coverFile,
  coverThumb,
  posterFile,
  previewFile,
  mediaFile,
  isPreviewProcessing,
  isMediaReady,
  isChannelReady,
  isAlbumReady,
  isReadyToUpload,
  uploadPhase,
  isUploading,
  progress,
  statusText,
  cancelUpload,
  startUploadJourney,
  resetUploadFlow,
  incrementCounter: baseIncrementCounter,
  onMediaStepPayloadUpdate: baseOnMediaStepPayloadUpdate,
  onMediaStepFileUpdate: baseOnMediaStepFileUpdate,
  onMediaStepPreviewUpdate: baseOnMediaStepPreviewUpdate,
  onChannelStepPayloadUpdate,
  onChannelStepCoverUpdate,
  onAlbumStepPayloadUpdate,
  onAlbumStepPosterUpdate
} = useUploadMediaForm()

const isChannelSummaryReady = computed(() => !!mediaFile.value && isChannelReady.value)
const isAlbumSummaryReady = computed(() => !!mediaFile.value && isAlbumReady.value)
const isVideoSummaryReady = computed(() => {
  if (isMediaReady.value) {
    return true
  }

  // During frame refresh, keep the check mark stable if video was already valid.
  return !!mediaFile.value && isPreviewProcessing.value && videoWasReady.value
})

const videoCompletionSource = computed(() => {
  if (!isVideoSummaryReady.value || !mediaFile.value) {
    return null
  }

  if (mediaUserModified.value) {
    return 'user'
  }

  const fileNameBase = (mediaFile.value.name || '').replace(/\.[^/.]+$/, '')
  const titleMatchesFile = payload.album?.media?.title === fileNameBase
  const usesFramePreview = payload.album?.media?.previewType === 'frame'

  return titleMatchesFile && usesFramePreview ? 'auto' : 'user'
})

const channelSummaryLabel = computed(() => {
  if (payload.channelMode === 'unselected') {
    return 'Channel'
  }
  if (payload.channelMode === 'create') {
    return payload.title || 'My Channel'
  }
  return payload.publicId?.label || 'Channel'
})

const channelCoverByPublicId = computed(() => {
  const map = {}
  for (const channel of channels.value || []) {
    if (channel?.publicId) {
      map[channel.publicId] = channel.cover || null
    }
  }
  return map
})

const channelSummaryAvatarSrc = computed(() => {
  if (!isChannelSummaryReady.value) {
    return null
  }

  if (payload.channelMode === 'unselected') {
    return null
  }

  if (payload.channelMode === 'create') {
    return payload.coverType === 'new' ? coverThumb.value : profile.value?.avatar || null
  }

  return channelCoverByPublicId.value[payload.publicId?.value] || null
})

const albumSummaryLabel = computed(() => {
  if (payload.album?.projectMode === 'unselected') {
    return 'Album'
  }
  if (payload.album.projectMode === 'create') {
    return payload.album?.title || 'My Videos'
  }
  return payload.album?.id?.label || 'Album'
})

const albumSummarySubtitle = computed(() => {
  if (payload.album?.projectMode === 'unselected') {
    return ''
  }

  if (payload.album.projectMode === 'create') {
    return payload.album?.subtitle || ''
  }

  return album.value?.subtitle || ''
})

const albumSummaryPosterSrc = computed(() => {
  if (!isAlbumSummaryReady.value) {
    return null
  }
  return album.value?.poster || null
})

const albumSummaryPosterColor = computed(() => {
  if (!isAlbumSummaryReady.value) {
    return '#000000'
  }

  if (payload.album?.projectMode === 'create') {
    return payload.album?.posterColor || '#000000'
  }

  return album.value?.posterColor || album.value?.poster_color || '#000000'
})

const contentState = computed(() => {
  if (!profile.value) {
    return 'auth-required'
  }
  if (isNewUserProfile.value) {
    return 'verification-pending'
  }
  if (uploadPhase.value === 'editing') {
    return 'editing'
  }
  return 'uploading-or-complete'
})

const isChannelAutoDefault = computed(() => {
  const channelList = channels.value || []

  if (payload.channelMode === 'create') {
    return (
      (payload.title || 'My Channel') === 'My Channel' &&
      payload.coverType === 'profile' &&
      !coverFile.value
    )
  }

  if (channelList.length === 0) {
    return (
      (payload.title || 'My Channel') === 'My Channel' &&
      payload.coverType === 'profile' &&
      !coverFile.value
    )
  }

  if (channelList.length === 1) {
    return payload.channelMode === 'existing' && payload.publicId?.value === channelList[0].publicId
  }

  return false
})

const channelCompletionSource = computed(() => {
  if (!isChannelSummaryReady.value) {
    return null
  }

  if (isChannelAutoDefault.value) {
    return 'auto'
  }

  return 'user'
})

const isAlbumAutoDefault = computed(() => {
  const albumList = albums.value || []
  const normalizedPosterColor = (payload.album?.posterColor || '#000000').toLowerCase()

  if (payload.album?.projectMode === 'create') {
    const subtitle = (payload.album?.subtitle || '').trim()
    return (
      (payload.album?.title || 'My Videos') === 'My Videos' &&
      payload.album?.posterType === 'default' &&
      !posterFile.value &&
      subtitle.length === 0 &&
      normalizedPosterColor === '#000000'
    )
  }

  if (albumList.length === 0) {
    return (
      (payload.album?.title || 'My Videos') === 'My Videos' &&
      payload.album?.posterType === 'default' &&
      !posterFile.value &&
      normalizedPosterColor === '#000000'
    )
  }

  if (albumList.length === 1) {
    return payload.album?.projectMode === 'existing' && payload.album?.id?.value === albumList[0].id
  }

  return false
})

const albumCompletionSource = computed(() => {
  if (!isAlbumSummaryReady.value) {
    return null
  }

  if (isAlbumAutoDefault.value) {
    return 'auto'
  }

  return 'user'
})

const videoCheckColor = computed(() =>
  videoCompletionSource.value === 'user' ? 'info' : undefined
)
const summaryDescriptionRaw = computed(() => media.value?.description || '')
const summaryDescriptionHtml = computed(() => sanitizeHtml(summaryDescriptionRaw.value))
const summaryDescriptionText = computed(() => sanitizeText(summaryDescriptionRaw.value).trim())
const hasSummaryDescription = computed(() => summaryDescriptionText.value.length > 0)
const composerPreviewImage = computed(() => media.value?.preview || null)

const channelEditorCoverSrc = computed(() => {
  if (payload.channelMode === 'create' && payload.coverType === 'new') {
    return coverThumb.value || null
  }
  return profile.value?.avatar || null
})

const albumEditorPosterSrc = computed(() => album.value?.poster || null)
const albumEditorPosterColor = computed(() => payload.album?.posterColor || '#000000')
const albumEditorPreview = computed(() => {
  const currentAlbum = album.value || {}
  const isNew = payload.album?.projectMode === 'create'
  const baseMedia = Array.isArray(currentAlbum.media) ? currentAlbum.media : []
  return {
    title: payload.album?.title || currentAlbum.title || 'My Videos',
    subtitle: payload.album?.subtitle || currentAlbum.subtitle || '',
    poster: albumEditorPosterSrc.value,
    posterColor: albumEditorPosterColor.value,
    media: isNew ? [{}] : baseMedia
  }
})

const capturedSinceLabel = computed(() => {
  if (!mediaFile.value) {
    return 'No capture date'
  }

  const resourceDate = payload.album?.media?.resourceDate
  if (!resourceDate) {
    return 'No capture date'
  }

  return `Captured ${daysSince(resourceDate, false)}`
})

const capturedSummaryLabel = computed(() => capturedSinceLabel.value)

function onComposerMediaTitleUpdate(value) {
  onComposerMediaPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      media: { ...payload.album.media, title: value }
    }
  })
}

function onComposerMediaDescriptionUpdate(value) {
  onComposerMediaPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      media: { ...payload.album.media, description: value }
    }
  })
}

function onComposerMediaResourceDateUpdate(value) {
  onComposerMediaPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      media: { ...payload.album.media, resourceDate: value ? value.replaceAll('/', '-') : value }
    }
  })
}

function onComposerMediaMainUpdate(value) {
  onComposerMediaPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      media: { ...payload.album.media, main: !!value }
    }
  })
}

function onComposerPreviewTypeUpdate(value) {
  onComposerMediaPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      media: { ...payload.album.media, previewType: value }
    }
  })

  if (value !== 'new') {
    onComposerMediaPreviewUpdate(null)
  }
}

function onComposerSelectExistingChannel(channel) {
  onChannelStepPayloadUpdate({
    ...payload,
    channelMode: 'existing',
    publicId: { value: channel.publicId, label: channel.title }
  })
  activeSection.value = 'album'
}

function onComposerSelectNewChannel() {
  onChannelStepPayloadUpdate({
    ...payload,
    channelMode: 'create',
    publicId: null,
    title: payload.title || 'My Channel',
    coverType: payload.coverType || 'profile'
  })
}

function onComposerSelectNewChannelCard() {
  if (payload.channelMode === 'create') {
    return
  }
  onComposerSelectNewChannel()
}

function onComposerChannelTitleUpdate(value) {
  onChannelStepPayloadUpdate({
    ...payload,
    title: value
  })
}

function restoreDefaultChannelTitle() {
  if (payload.channelMode === 'create' && (!payload.title || payload.title.trim() === '')) {
    onChannelStepPayloadUpdate({
      ...payload,
      title: 'My Channel'
    })
  }
}

function onComposerChannelCoverTypeUpdate(value) {
  onChannelStepPayloadUpdate({
    ...payload,
    coverType: value
  })

  if (value !== 'new') {
    onChannelStepCoverUpdate(null)
  }
}

function onComposerChannelCoverFileUpdate(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  onChannelStepCoverUpdate(file)
}

function onComposerSelectExistingAlbum(selectedAlbum) {
  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      projectMode: 'existing',
      id: { value: selectedAlbum.id, label: selectedAlbum.title }
    }
  })
}

function onComposerSelectNewAlbum() {
  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      projectMode: 'create',
      id: null,
      title: payload.album?.title || 'My Videos',
      posterType: payload.album?.posterType || 'default'
    }
  })
}

function onComposerSelectNewAlbumCard() {
  if (payload.album?.projectMode === 'create') {
    return
  }
  onComposerSelectNewAlbum()
}

function onComposerAlbumTitleUpdate(value) {
  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      title: value
    }
  })
}

function restoreDefaultAlbumTitle() {
  if (
    payload.album?.projectMode === 'create' &&
    (!payload.album?.title || payload.album.title.trim() === '')
  ) {
    onAlbumStepPayloadUpdate({
      ...payload,
      album: {
        ...payload.album,
        title: 'My Videos'
      }
    })
  }
}

function onComposerAlbumSubtitleUpdate(value) {
  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      subtitle: value
    }
  })
}

function onComposerAlbumPosterTypeUpdate(value) {
  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      posterType: value
    }
  })

  if (value !== 'new') {
    onAlbumStepPosterUpdate(null)
  }
}

function onComposerAlbumPosterColorUpdate(value) {
  let normalizedColor = '#000000'
  if (typeof value === 'string') {
    normalizedColor = value.startsWith('#') ? value : `#${value}`
  }

  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      posterColor: normalizedColor
    }
  })
}

function onComposerAlbumPosterFileUpdate(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  onAlbumStepPosterUpdate(file)
}

function onComposerMediaPayloadUpdate(partial) {
  if (mediaFile.value) {
    mediaUserModified.value = true
  }
  baseOnMediaStepPayloadUpdate(partial)
}

function onComposerMediaFileUpdate(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  mediaUserModified.value = false
  baseOnMediaStepFileUpdate(file)
}

function onComposerMediaPreviewUpdate(file) {
  if (mediaFile.value) {
    mediaUserModified.value = true
  }
  baseOnMediaStepPreviewUpdate(file)
}

function onComposerMediaRefresh() {
  if (mediaFile.value) {
    mediaUserModified.value = true
  }
  baseIncrementCounter()
}

function onSectionToggle(section, isOpen) {
  activeSection.value = isOpen ? section : null
}

function onVideoSectionToggle(isOpen) {
  onSectionToggle('video', isOpen)
}

function onChannelSectionToggle(isOpen) {
  onSectionToggle('channel', isOpen)
}

function onAlbumSectionToggle(isOpen) {
  onSectionToggle('album', isOpen)
}

function onAlbumColorDialogUpdate(value) {
  albumColorDialog.value = value
}

watch(mediaFile, file => {
  if (file) {
    activeSection.value = 'video'
    mediaUserModified.value = false
    return
  }
  activeSection.value = null
  mediaUserModified.value = false
  videoWasReady.value = false
})

watch(isMediaReady, ready => {
  if (ready) {
    videoWasReady.value = true
  }
})

function onMediaFileRejected(rejectedEntries) {
  const first = rejectedEntries?.[0]
  const failedProp = first?.failedPropValidation || first?.failedProp

  if (failedProp === 'accept') {
    $q.notify({
      color: 'negative',
      icon: 'warning',
      message: 'Unsupported file type. Please choose a video file.'
    })
    return
  }

  $q.notify({
    color: 'negative',
    icon: 'warning',
    message: 'Selected file could not be added. Please try a different file.'
  })
}
</script>

<style scoped>
.composer-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) 1fr;
  grid-template-areas:
    'summary details'
    'summary actions';
  align-items: start;
  gap: 16px;
}

.composer-summary-card {
  grid-area: summary;
}

.composer-details-pane {
  grid-area: details;
}

.composer-actions-card {
  grid-area: actions;
}

@media (max-width: 959px) {
  .composer-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'details'
      'summary'
      'actions';
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 16px;
  }
}
</style>
