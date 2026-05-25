<template>
  <div v-if="profile?.id" class="q-pa-md" data-cy="upload-page-composer">
    <q-item class="q-pb-md">
      <q-item-section>
        <q-item-label class="text-h5">Upload Video</q-item-label>
        <q-item-label caption>Composer Flow</q-item-label>
      </q-item-section>
    </q-item>

    <q-banner
      v-if="isNewUserProfile"
      rounded
      class="bg-orange-1 text-orange-10 q-pa-md"
      data-cy="upload-verification-pending-message">
      Uploads are currently disabled pending account verification, which usually happens within 24
      hours.
    </q-banner>

    <template v-else>
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
        <q-card flat bordered class="q-pa-sm composer-summary-card">
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm row items-center no-wrap q-gutter-xs">
              <q-icon name="cloud_upload" size="18px" color="grey-8" />
              <span>Upload Summary</span>
            </div>
            <MediaPreview
              :media="media"
              :album="album"
              :detail="uploadPhase === 'complete'" />
            <div
              class="summary-description-box q-mt-sm"
              :class="{ 'is-empty': !hasSummaryDescription }">
              <div class="text-caption text-grey-7 q-mb-xs">Description</div>
              <p class="summary-description-text">
                {{ hasSummaryDescription ? summaryDescriptionText : 'No description added yet.' }}
              </p>
            </div>
            <q-list dense class="q-mt-md">
              <q-item>
                <q-item-section avatar class="summary-resource-avatar">
                  <q-icon
                    v-if="isVideoSummaryReady"
                    name="movie"
                    size="22px"
                    :color="videoCheckColor || 'dark'" />
                  <span v-else class="summary-step-dot text-grey-6" aria-hidden="true" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Video Details</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    v-if="videoCompletionSource === 'auto'"
                    outline
                    color="blue-grey-6"
                    label="Defaulted" />
                  <q-badge
                    v-else-if="videoCompletionSource === 'user'"
                    outline
                    color="positive"
                    label="Custom" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar class="summary-resource-avatar">
                  <q-avatar v-if="isChannelSummaryReady" size="26px" class="summary-step-avatar">
                    <q-img
                      v-if="channelSummaryAvatarSrc"
                      :src="channelSummaryAvatarSrc"
                      fit="cover"
                      loading="lazy"
                      decoding="async" />
                    <q-icon v-else name="apps" size="14px" color="dark" />
                  </q-avatar>
                  <span v-else class="summary-step-dot text-grey-6" aria-hidden="true" />
                </q-item-section>
                <q-item-section class="summary-item-section">
                  <q-item-label class="summary-item-label">{{ channelSummaryLabel }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    v-if="channelCompletionSource === 'auto'"
                    outline
                    color="blue-grey-6"
                    label="Defaulted" />
                  <q-badge
                    v-else-if="channelCompletionSource === 'user'"
                    outline
                    color="positive"
                    label="Custom" />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar top class="summary-resource-avatar summary-avatar-top">
                  <q-avatar
                    v-if="isAlbumSummaryReady"
                    size="26px"
                    class="summary-step-avatar"
                    :class="{ 'summary-step-swatch': !albumSummaryPosterSrc }"
                    :style="albumSummaryPosterSrc ? undefined : { backgroundColor: albumSummaryPosterColor }">
                    <q-img
                      v-if="albumSummaryPosterSrc"
                      :src="albumSummaryPosterSrc"
                      fit="cover"
                      loading="lazy"
                      decoding="async" />
                  </q-avatar>
                  <span v-else class="summary-step-dot text-grey-6" aria-hidden="true" />
                </q-item-section>
                <q-item-section class="summary-item-section">
                  <q-item-label class="summary-item-label">{{ albumSummaryLabel }}</q-item-label>
                  <q-item-label v-if="albumSummarySubtitle" caption class="summary-item-subtitle">
                    {{ albumSummarySubtitle }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    v-if="albumCompletionSource === 'auto'"
                    outline
                    color="blue-grey-6"
                    label="Defaulted" />
                  <q-badge
                    v-else-if="albumCompletionSource === 'user'"
                    outline
                    color="positive"
                    label="Custom" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="summary-captured text-caption text-grey-7 q-mt-sm">
              Captured {{ capturedSinceLabel }}
            </div>
          </q-card-section>
        </q-card>

        <div class="composer-details-pane">
          <div class="expansion-wrapper" :class="{ 'is-blocked': !mediaFile }">
            <q-expansion-item
              :model-value="activeSection === 'video'"
              @update:model-value="onSectionToggle('video', $event)"
              icon="movie"
              label="Video Details"
              header-class="bg-grey-2"
              class="q-mb-sm"
              :disable="!mediaFile">
              <div class="q-pt-md q-px-md q-pb-none">
                <MediaStep
                  :payload="payload"
                  :media="media"
                  :mediaFile="mediaFile"
                  :previewFile="previewFile"
                  :handleFile="handleFile"
                  :previewProcessing="isPreviewProcessing"
                  :showFileInput="false"
                  :showPreviewElement="false"
                  @update:payload="onComposerMediaPayloadUpdate"
                  @update:mediaFile="onComposerMediaFileUpdate"
                  @update:previewFile="onComposerMediaPreviewUpdate"
                  @increment:counter="onComposerMediaRefresh" />
              </div>
            </q-expansion-item>
            <q-tooltip v-if="!mediaFile" anchor="center left" self="center right">
              Select a video file first.
            </q-tooltip>
          </div>

          <div class="expansion-wrapper" :class="{ 'is-blocked': !mediaFile }">
            <q-expansion-item
              :model-value="activeSection === 'channel'"
              @update:model-value="onSectionToggle('channel', $event)"
              icon="apps"
              label="Channel"
              header-class="bg-grey-2"
              class="q-mb-sm"
              :disable="!mediaFile">
              <div class="q-pa-md">
                <ChannelStep
                  :payload="payload"
                  :channels="channels"
                  :profile="profile"
                  :coverFile="coverFile"
                  :coverThumb="coverThumb"
                  :handleFile="handleFile"
                  @update:payload="onChannelStepPayloadUpdate"
                  @update:coverFile="onChannelStepCoverUpdate" />
              </div>
            </q-expansion-item>
            <q-tooltip v-if="!mediaFile" anchor="center left" self="center right">
              Select a video file first.
            </q-tooltip>
          </div>

          <div class="expansion-wrapper" :class="{ 'is-blocked': !mediaFile }">
            <q-expansion-item
              :model-value="activeSection === 'album'"
              @update:model-value="onSectionToggle('album', $event)"
              icon="folder"
              label="Album"
              header-class="bg-grey-2"
              class="q-mb-sm"
              :disable="!mediaFile">
              <div class="q-pa-md">
                <AlbumStep
                  :payload="payload"
                  :albums="albums"
                  :album="album"
                  :posterFile="posterFile"
                  :handleFile="handleFile"
                  @update:payload="onAlbumStepPayloadUpdate"
                  @update:posterFile="onAlbumStepPosterUpdate" />
              </div>
            </q-expansion-item>
            <q-tooltip v-if="!mediaFile" anchor="center left" self="center right">
              Select a video file first.
            </q-tooltip>
          </div>
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

      <q-banner v-if="uploadPhase === 'uploading'" rounded class="bg-grey-1 text-grey-9 q-mt-md">
        <div class="row items-center no-wrap q-gutter-md">
          <q-circular-progress
            :indeterminate="progress === -1"
            :value="progress"
            size="52px"
            color="accent"
            track-color="grey-3"
            show-value />
          <div>
            <div class="text-subtitle2">{{ media.title || 'Uploading media' }}</div>
            <div class="text-caption">{{ statusText }}</div>
          </div>
        </div>
      </q-banner>

      <q-banner v-if="uploadPhase === 'complete'" rounded class="bg-green-1 text-green-10 q-mt-md">
        <div class="text-subtitle2">Upload complete</div>
        <div>{{ media.title }} was uploaded successfully. We will email you when your video is live.</div>
      </q-banner>
    </template>
  </div>
  <AuthRequired v-else type="login" message="Please log in to upload videos." />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import ChannelStep from './UploadMedia/ChannelStep.vue'
import AlbumStep from './UploadMedia/AlbumStep.vue'
import MediaStep from './UploadMedia/MediaStep.vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { useUploadMediaForm } from '@composables/useUploadMediaForm.js'
import { daysSince } from '@utils/date.js'

const $q = useQuasar()
const activeSection = ref(null)
const mediaUserModified = ref(false)
const videoWasReady = ref(false)

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
  handleFile,
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
  const selectedPublicId = payload.publicId?.value
  if (selectedPublicId == null) {
    return 'Channel'
  }
  if (selectedPublicId === 0) {
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

  const selectedPublicId = payload.publicId?.value
  if (selectedPublicId == null) {
    return null
  }

  if (selectedPublicId === 0) {
    return payload.coverType === 'new' ? coverThumb.value : profile.value?.avatar || null
  }

  return channelCoverByPublicId.value[selectedPublicId] || null
})

const albumSummaryLabel = computed(() => {
  const selectedAlbumId = payload.album?.id?.value
  if (selectedAlbumId == null) {
    return 'Album'
  }
  if (selectedAlbumId === 0) {
    return payload.album?.title || 'My Videos'
  }
  return payload.album?.id?.label || 'Album'
})

const albumSummarySubtitle = computed(() => {
  const selectedAlbumId = payload.album?.id?.value
  if (selectedAlbumId == null) {
    return ''
  }

  if (selectedAlbumId === 0) {
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

  if (payload.album?.id?.value === 0) {
    return payload.album?.posterColor || '#000000'
  }

  return album.value?.posterColor || album.value?.poster_color || '#000000'
})

const isChannelAutoDefault = computed(() => {
  const channelList = channels.value || []
  const selectedPublicId = payload.publicId?.value

  if (channelList.length === 0) {
    return (
      selectedPublicId === 0 &&
      (payload.title || 'My Channel') === 'My Channel' &&
      payload.coverType === 'profile' &&
      !coverFile.value
    )
  }

  if (channelList.length === 1) {
    return selectedPublicId === channelList[0].publicId
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
  const selectedAlbumId = payload.album?.id?.value

  if (albumList.length === 0) {
    return (
      selectedAlbumId === 0 &&
      (payload.album?.title || 'My Videos') === 'My Videos' &&
      payload.album?.posterType === 'default' &&
      !posterFile.value
    )
  }

  if (albumList.length === 1) {
    return selectedAlbumId === albumList[0].id
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

const videoCheckColor = computed(() => (videoCompletionSource.value === 'user' ? 'info' : undefined))
const summaryDescriptionText = computed(() => (media.value?.description || '').trim())
const hasSummaryDescription = computed(() => summaryDescriptionText.value.length > 0)
const capturedSinceLabel = computed(() => {
  const resourceDate = payload.album?.media?.resourceDate
  if (!resourceDate) {
    return 'date not set'
  }

  return daysSince(resourceDate, false)
})

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

.expansion-wrapper.is-blocked {
  cursor: not-allowed;
}

.summary-item-section {
  min-width: 0;
}

.summary-item-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-step-dot {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 2px dashed currentColor;
  box-sizing: border-box;
}

.summary-description-box {
  border: 1px solid var(--q-grey-4);
  border-radius: 6px;
  padding: 8px 10px;
}

.summary-description-box.is-empty {
  border-style: dashed;
}

.summary-description-text {
  margin: 0;
  line-height: 1.35;
  line-clamp: 3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary-description-box.is-empty .summary-description-text {
  color: var(--q-grey-6);
}

.summary-step-avatar {
  overflow: hidden;
}

.summary-step-swatch {
  border: 1px solid #000000;
  box-sizing: border-box;
}

.summary-resource-avatar {
  align-items: center;
}

.summary-avatar-top {
  padding-top: 2px;
}

.summary-item-subtitle {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.65;
}

.summary-captured {
  border-top: 1px solid var(--q-grey-3);
  padding-top: 8px;
}

@media (max-width: 959px) {
  .composer-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'details'
      'summary'
      'actions';
  }
}
</style>
