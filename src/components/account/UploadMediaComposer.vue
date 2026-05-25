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
              <div
                v-if="hasSummaryDescription"
                class="summary-description-text"
                v-html="summaryDescriptionHtml"></div>
              <p v-else class="summary-description-text">No description added yet.</p>
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
              {{ capturedSummaryLabel }}
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
              <div class="q-pt-md q-px-md q-pb-none composer-content-panel">
                <q-input
                  outlined
                  :color="inputColor"
                  class="q-pb-md"
                  clearable
                  :model-value="payload.album?.media?.title"
                  label="Video Title *"
                  data-cy="upload-media-title"
                  @update:model-value="onComposerMediaTitleUpdate" />

                <MediaMetadataFields
                  :description="payload.album?.media?.description"
                  :resource-date="payload.album?.media?.resourceDate"
                  :main="payload.album?.media?.main"
                  :input-color="inputColor"
                  :show-description="true"
                  :show-extended-attributes="true"
                  @update:description="onComposerMediaDescriptionUpdate"
                  @update:resource-date="onComposerMediaResourceDateUpdate"
                  @update:main="onComposerMediaMainUpdate" />

                <div class="text-overline q-mb-xs">Video Preview</div>
                <q-btn-toggle
                  unelevated
                  no-caps
                  class="q-mb-md"
                  :model-value="payload.album?.media?.previewType"
                  color="primary"
                  toggle-color="accent"
                  :options="[
                    { label: 'Video Frame', value: 'frame' },
                    { label: 'Upload Photo', value: 'new' }
                  ]"
                  @update:model-value="onComposerPreviewTypeUpdate" />

                <q-file
                  v-if="payload.album?.media?.previewType === 'new'"
                  outlined
                  label="Preview Image"
                  :model-value="previewFile"
                  accept="image/*"
                  class="q-pb-md"
                  color="accent"
                  data-cy="preview-image-file"
                  @update:model-value="onComposerMediaPreviewUpdate">
                  <template v-slot:prepend>
                    <q-icon name="image" @click.stop.prevent />
                  </template>
                  <template v-slot:append>
                    <q-icon
                      name="close"
                      @click.stop.prevent="onComposerMediaPreviewUpdate(null)"
                      class="cursor-pointer" />
                  </template>
                </q-file>

                <div class="q-pb-sm">
                  <div
                    class="composer-preview-frame"
                    :class="{ 'composer-preview-featured': payload.album?.media?.main }">
                    <MediaPreview
                      v-if="composerPreviewImage"
                      class="composer-preview-media"
                      :media="{
                        title: 'Video preview',
                        preview: composerPreviewImage,
                        main: payload.album?.media?.main
                      }"
                      :interactive="false"
                      :show-badges="false"
                      :show-title-overlay="false" />
                    <q-skeleton
                      v-else
                      type="rect"
                      class="composer-preview-skeleton"
                      animation="none" />
                  </div>
                  <q-btn
                    v-if="payload.album?.media?.previewType === 'frame'"
                    class="q-mt-sm"
                    :disable="!mediaFile || isPreviewProcessing"
                    :loading="isPreviewProcessing"
                    icon="autorenew"
                    label="Refresh thumbnail"
                    no-caps
                    flat
                    color="accent"
                    @click="onComposerMediaRefresh">
                    <q-tooltip>Refresh Thumbnail</q-tooltip>
                  </q-btn>
                </div>
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
              <div class="q-pa-md composer-content-panel">
                <div class="text-overline q-mb-sm">Choose Channel</div>
                <div class="composer-choice-grid q-mb-md">
                  <q-card
                    v-for="channel in channels"
                    :key="`channel-${channel.publicId}`"
                    flat
                    bordered
                    class="composer-choice-card"
                    :class="{ 'is-selected': payload.publicId?.value === channel.publicId }"
                    @click="onComposerSelectExistingChannel(channel)">
                    <q-card-section class="row items-center q-col-gutter-sm no-wrap">
                      <div class="col-auto">
                        <q-avatar size="38px">
                          <q-img v-if="channel.cover" :src="channel.cover" fit="cover" />
                          <q-icon v-else name="apps" color="grey-7" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-body2 ellipsis">{{ channel.title }}</div>
                        <div class="text-caption text-grey-6">Existing channel</div>
                      </div>
                    </q-card-section>
                  </q-card>

                  <q-card
                    flat
                    bordered
                    class="composer-choice-card"
                    :class="{
                      'is-selected': payload.publicId?.value === 0,
                      'is-disabled': payload.publicId?.value === 0
                    }"
                    @click="onComposerSelectNewChannelCard">
                    <q-card-section class="row items-center q-col-gutter-sm no-wrap">
                      <div class="col-auto">
                        <q-avatar size="38px" color="grey-2" text-color="grey-8" icon="add" />
                      </div>
                      <div class="col">
                        <div class="text-body2">Create New Channel</div>
                        <div class="text-caption text-grey-6">Set title and cover</div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="payload.publicId?.value === 0">
                  <q-input
                    outlined
                    :color="inputColor"
                    class="q-pb-md"
                    clearable
                    :model-value="payload.title"
                    label="Channel Title *"
                    data-cy="upload-channel-title"
                    @blur="restoreDefaultChannelTitle"
                    @update:model-value="onComposerChannelTitleUpdate" />

                  <div class="text-overline q-mb-xs">Channel Cover</div>
                  <q-btn-toggle
                    unelevated
                    no-caps
                    class="q-mb-md"
                    :model-value="payload.coverType"
                    color="primary"
                    toggle-color="accent"
                    :options="[
                      { label: 'Profile Photo', value: 'profile' },
                      { label: 'Upload Photo', value: 'new' }
                    ]"
                    @update:model-value="onComposerChannelCoverTypeUpdate" />

                  <q-file
                    v-if="payload.coverType === 'new'"
                    outlined
                    label="Channel Cover (Image)"
                    :model-value="coverFile"
                    accept="image/*"
                    class="q-mb-md"
                    color="accent"
                    data-cy="upload-channel-cover-file"
                    @update:model-value="onComposerChannelCoverFileUpdate">
                    <template v-slot:prepend>
                      <q-icon name="image" @click.stop.prevent />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        name="close"
                        @click.stop.prevent="onComposerChannelCoverFileUpdate(null)"
                        class="cursor-pointer" />
                    </template>
                  </q-file>

                  <div class="row items-center q-gutter-sm q-pb-sm">
                    <q-avatar size="96px" class="composer-cover-preview">
                      <q-img
                        v-if="channelEditorCoverSrc"
                        :src="channelEditorCoverSrc"
                        fit="cover"
                        loading="lazy"
                        decoding="async" />
                      <q-icon v-else name="person" color="grey-7" />
                    </q-avatar>
                  </div>
                </div>
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
              <div class="q-pa-md composer-content-panel">
                <div class="text-overline q-mb-sm">Choose Album</div>
                <div class="composer-choice-grid q-mb-md">
                  <q-card
                    v-for="item in albums"
                    :key="`album-${item.id}`"
                    flat
                    bordered
                    class="composer-choice-card"
                    :class="{ 'is-selected': payload.album?.id?.value === item.id }"
                    @click="onComposerSelectExistingAlbum(item)">
                    <q-card-section class="row items-center q-col-gutter-sm no-wrap">
                      <div class="col-auto">
                        <q-avatar size="38px">
                          <q-img v-if="item.poster" :src="item.poster" fit="cover" />
                          <div
                            v-else
                            class="composer-color-swatch"
                            :style="{ backgroundColor: item.posterColor || item.poster_color || '#000000' }" />
                        </q-avatar>
                      </div>
                      <div class="col">
                        <div class="text-body2 ellipsis">{{ item.title }}</div>
                        <div class="text-caption text-grey-6 ellipsis">{{ item.subtitle || 'Existing album' }}</div>
                      </div>
                    </q-card-section>
                  </q-card>

                  <q-card
                    flat
                    bordered
                    class="composer-choice-card"
                    :class="{
                      'is-selected': payload.album?.id?.value === 0,
                      'is-disabled': payload.album?.id?.value === 0
                    }"
                    @click="onComposerSelectNewAlbumCard">
                    <q-card-section class="row items-center q-col-gutter-sm no-wrap">
                      <div class="col-auto">
                        <q-avatar size="38px" color="grey-2" text-color="grey-8" icon="add" />
                      </div>
                      <div class="col">
                        <div class="text-body2 ellipsis">Create New Album</div>
                        <div class="text-caption text-grey-6 ellipsis">Set album details</div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="payload.album?.id?.value === 0">
                  <q-input
                    outlined
                    :color="inputColor"
                    class="q-pb-md"
                    clearable
                    :model-value="payload.album?.title"
                    label="Album Title *"
                    data-cy="upload-album-title"
                    @blur="restoreDefaultAlbumTitle"
                    @update:model-value="onComposerAlbumTitleUpdate" />

                  <q-input
                    outlined
                    :color="inputColor"
                    class="q-pb-md"
                    clearable
                    :model-value="payload.album?.subtitle"
                    label="Album Subtitle"
                    data-cy="upload-album-subtitle"
                    @update:model-value="onComposerAlbumSubtitleUpdate" />

                  <div class="text-overline q-mb-xs">Album Poster</div>
                  <q-btn-toggle
                    unelevated
                    no-caps
                    class="q-mb-md"
                    :model-value="payload.album?.posterType"
                    color="primary"
                    toggle-color="accent"
                    :options="[
                      { label: 'Solid Colour', value: 'default' },
                      { label: 'Upload Photo', value: 'new' }
                    ]"
                    @update:model-value="onComposerAlbumPosterTypeUpdate" />

                  <q-file
                    v-if="payload.album?.posterType === 'new'"
                    outlined
                    label="Album Poster (Image)"
                    :model-value="posterFile"
                    accept="image/*"
                    class="q-mb-md"
                    color="accent"
                    data-cy="upload-album-poster-file"
                    @update:model-value="onComposerAlbumPosterFileUpdate">
                    <template v-slot:prepend>
                      <q-icon name="image" @click.stop.prevent />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        name="close"
                        @click.stop.prevent="onComposerAlbumPosterFileUpdate(null)"
                        class="cursor-pointer" />
                    </template>
                  </q-file>

                  <div class="q-pb-sm composer-album-poster-preview">
                    <AlbumPoster :album="albumEditorPreview" />
                  </div>
                </div>

                <div
                  v-if="payload.album?.id?.value === 0 && payload.album?.posterType === 'default'"
                  class="q-pb-sm">
                  <q-btn
                    flat
                    no-caps
                    color="accent"
                    icon="palette"
                    label="Change Colour"
                    @click="albumColorDialog = true" />
                </div>

                <q-dialog
                  v-model="albumColorDialog"
                  v-if="payload.album?.id?.value === 0 && payload.album?.posterType === 'default'">
                  <q-card style="min-width: 300px">
                    <q-card-section class="q-pb-none">
                      <div class="text-subtitle1">Choose Poster Colour</div>
                    </q-card-section>
                    <q-card-section>
                      <q-color
                        class="q-mt-sm"
                        :model-value="payload.album?.posterColor || '#000000'"
                        format="hex"
                        default-view="palette"
                        @update:model-value="onComposerAlbumPosterColorUpdate" />
                    </q-card-section>
                    <q-card-actions align="right">
                      <q-btn flat label="Close" @click="albumColorDialog = false" />
                    </q-card-actions>
                  </q-card>
                </q-dialog>
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
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
import AlbumPoster from '@components/channel/shared/AlbumPoster.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'
import { useUploadMediaForm } from '@composables/useUploadMediaForm.js'
import { daysSince } from '@utils/date.js'
import { sanitizeHtml, sanitizeText } from '@utils/text.js'

const $q = useQuasar()
const activeSection = ref(null)
const mediaUserModified = ref(false)
const videoWasReady = ref(false)
const albumColorDialog = ref(false)
const inputColor = computed(() => ($q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'))

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

  if (selectedPublicId === 0) {
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

  if (selectedAlbumId === 0) {
    const subtitle = (payload.album?.subtitle || '').trim()
    return (
      (payload.album?.title || 'My Videos') === 'My Videos' &&
      payload.album?.posterType === 'default' &&
      !posterFile.value &&
      subtitle.length === 0
    )
  }

  if (albumList.length === 0) {
    return (
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
const summaryDescriptionRaw = computed(() => media.value?.description || '')
const summaryDescriptionHtml = computed(() => sanitizeHtml(summaryDescriptionRaw.value))
const summaryDescriptionText = computed(() => sanitizeText(summaryDescriptionRaw.value).trim())
const hasSummaryDescription = computed(() => summaryDescriptionText.value.length > 0)
const composerPreviewImage = computed(() => media.value?.preview || null)

const channelEditorCoverSrc = computed(() => {
  if (payload.coverType === 'new') {
    return coverThumb.value || null
  }
  return profile.value?.avatar || null
})

const albumEditorPosterSrc = computed(() => album.value?.poster || null)
const albumEditorPosterColor = computed(() => payload.album?.posterColor || '#000000')
const albumEditorPreview = computed(() => {
  const currentAlbum = album.value || {}
  return {
    title: payload.album?.title || currentAlbum.title || 'My Videos',
    subtitle: payload.album?.subtitle || currentAlbum.subtitle || '',
    poster: albumEditorPosterSrc.value,
    posterColor: albumEditorPosterColor.value,
    media: Array.isArray(currentAlbum.media) ? currentAlbum.media : []
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
    publicId: { value: channel.publicId, label: channel.title }
  })
  activeSection.value = 'album'
}

function onComposerSelectNewChannel() {
  onChannelStepPayloadUpdate({
    ...payload,
    publicId: { value: 0, label: 'New...' },
    title: payload.title || 'My Channel',
    coverType: payload.coverType || 'profile'
  })
}

function onComposerSelectNewChannelCard() {
  if (payload.publicId?.value === 0) {
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
  if (payload.publicId?.value === 0 && (!payload.title || payload.title.trim() === '')) {
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
      id: { value: selectedAlbum.id, label: selectedAlbum.title }
    }
  })
}

function onComposerSelectNewAlbum() {
  onAlbumStepPayloadUpdate({
    ...payload,
    album: {
      ...payload.album,
      id: { value: 0, label: 'New...' },
      title: payload.album?.title || 'My Videos',
      posterType: payload.album?.posterType || 'default'
    }
  })
}

function onComposerSelectNewAlbumCard() {
  if (payload.album?.id?.value === 0) {
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
  if (payload.album?.id?.value === 0 && (!payload.album?.title || payload.album.title.trim() === '')) {
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

.composer-content-panel {
  border: 1px solid var(--q-grey-3);
  border-top: 0;
  border-radius: 0 0 8px 8px;
  background: color-mix(in srgb, var(--q-grey-1) 56%, white);
}

.composer-choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.composer-choice-card {
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.composer-choice-card:hover {
  border-color: var(--q-grey-5);
}

.composer-choice-card.is-selected {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--q-primary) 30%, transparent);
}

.composer-choice-card.is-disabled,
.composer-choice-card.is-disabled * {
  cursor: not-allowed;
}

.composer-choice-card.is-disabled:hover {
  border-color: var(--q-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--q-primary) 30%, transparent);
}

.composer-cover-preview {
  border: 1px solid var(--q-grey-4);
  overflow: hidden;
}

.composer-color-swatch {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 1px solid #000;
}

.composer-cover-swatch {
  border: 1px solid #000;
}

.composer-album-poster-preview {
  width: 220px;
}

.composer-preview-frame {
  width: 250px;
  padding: 8px;
  box-sizing: border-box;
}

.composer-preview-featured {
  background: var(--q-accent);
}

.composer-preview-media {
  width: 100%;
}

.composer-preview-skeleton {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.full-fit {
  width: 100%;
  height: 100%;
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
  border-color: rgba(98, 112, 127, 0.35);
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

.summary-description-text :deep(p) {
  margin: 0;
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
