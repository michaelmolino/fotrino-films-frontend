<template>
  <div class="expansion-wrapper" :class="wrapperClass">
    <q-expansion-item
      :model-value="isSectionOpen"
      @update:model-value="onSectionModelUpdate"
      icon="movie"
      label="Video Details"
      :header-class="expansionHeaderClass"
      class="q-mb-sm"
      :disable="isBlocked">
      <div class="q-pt-md q-px-md q-pb-none composer-content-panel">
        <q-input
          outlined
          :color="inputColor"
          class="q-pb-md"
          clearable
          :model-value="mediaTitle"
          label="Video Title *"
          data-cy="upload-media-title"
          @update:model-value="onMediaTitleUpdate" />

        <MediaMetadataFields
          :description="mediaDescription"
          :resource-date="mediaResourceDate"
          :main="mediaIsMain"
          :input-color="inputColor"
          :show-description="true"
          :show-extended-attributes="true"
          @update:description="onMediaDescriptionUpdate"
          @update:resource-date="onMediaResourceDateUpdate"
          @update:main="onMediaMainUpdate" />

        <div class="text-overline q-mb-xs">Video Preview</div>
        <div class="composer-control-stack q-pb-sm">
          <q-btn-toggle
            unelevated
            no-caps
            class="q-mb-md"
            :model-value="previewType"
            color="primary"
            toggle-color="accent"
            :options="previewTypeOptions"
            @update:model-value="onPreviewTypeUpdate" />

          <q-file
            v-if="showPreviewUploadInput"
            outlined
            label="Preview Image"
            :model-value="previewFile"
            accept="image/*"
            class="q-pb-md full-width"
            color="accent"
            data-cy="preview-image-file"
            @update:model-value="onMediaPreviewUpdate">
            <template #prepend>
              <q-icon name="image" @click.stop.prevent />
            </template>
            <template #append>
              <q-icon name="close" @click.stop.prevent="clearMediaPreview" class="cursor-pointer" />
            </template>
          </q-file>

          <div class="composer-preview-with-action">
            <div class="composer-preview-frame" :class="previewFrameClass">
              <MediaPreview
                v-if="composerPreviewImage"
                class="composer-preview-media"
                :media="previewMedia"
                :interactive="false"
                :show-badges="false"
                :show-title-overlay="false" />
              <q-skeleton v-else type="rect" class="composer-preview-skeleton" animation="none" />
            </div>
            <q-btn
              v-if="showRefreshThumbnail"
              class="q-mt-sm"
              :style="flatAccentBtnStyle"
              :disable="isRefreshDisabled"
              :loading="isPreviewProcessing"
              icon="autorenew"
              label="Refresh thumbnail"
              no-caps
              flat
              color="accent"
              @click="onMediaRefresh">
              <q-tooltip>Refresh Thumbnail</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </q-expansion-item>
    <q-tooltip v-if="isBlocked" anchor="center left" self="center right">
      Select a video file first.
    </q-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'

const emit = defineEmits([
  'section-toggle',
  'media-title-update',
  'media-description-update',
  'media-resource-date-update',
  'media-main-update',
  'preview-type-update',
  'media-preview-update',
  'media-refresh'
])

const props = defineProps({
  activeSection: { type: String, default: null },
  mediaFile: { type: [File, Object], default: null },
  expansionHeaderClass: { type: String, required: true },
  inputColor: { type: String, required: true },
  payload: { type: Object, required: true },
  previewFile: { type: [File, Object], default: null },
  composerPreviewImage: { type: String, default: null },
  isPreviewProcessing: { type: Boolean, required: true },
  flatAccentBtnStyle: { type: Object, default: undefined }
})

const previewTypeOptions = [
  { label: 'Video Frame', value: 'frame' },
  { label: 'Upload Photo', value: 'new' }
]

const isBlocked = computed(() => !props.mediaFile)
const isSectionOpen = computed(() => props.activeSection === 'video')
const wrapperClass = computed(() => ({ 'is-blocked': isBlocked.value }))
const mediaTitle = computed(() => props.payload.album?.media?.title)
const mediaDescription = computed(() => props.payload.album?.media?.description)
const mediaResourceDate = computed(() => props.payload.album?.media?.resourceDate)
const mediaIsMain = computed(() => !!props.payload.album?.media?.main)
const previewType = computed(() => props.payload.album?.media?.previewType)
const showPreviewUploadInput = computed(() => previewType.value === 'new')
const previewMedia = computed(() => ({
  title: 'Video preview',
  preview: props.composerPreviewImage,
  main: mediaIsMain.value
}))
const previewFrameClass = computed(() => ({ 'composer-preview-featured': mediaIsMain.value }))
const showRefreshThumbnail = computed(() => previewType.value === 'frame')
const isRefreshDisabled = computed(() => isBlocked.value || props.isPreviewProcessing)

function onSectionModelUpdate(value) {
  emit('section-toggle', value)
}

function onMediaTitleUpdate(value) {
  emit('media-title-update', value)
}

function onMediaDescriptionUpdate(value) {
  emit('media-description-update', value)
}

function onMediaResourceDateUpdate(value) {
  emit('media-resource-date-update', value)
}

function onMediaMainUpdate(value) {
  emit('media-main-update', value)
}

function onPreviewTypeUpdate(value) {
  emit('preview-type-update', value)
}

function onMediaPreviewUpdate(value) {
  emit('media-preview-update', value)
}

function clearMediaPreview() {
  emit('media-preview-update', null)
}

function onMediaRefresh() {
  emit('media-refresh')
}
</script>

<style scoped>
.expansion-wrapper.is-blocked {
  cursor: not-allowed;
}

.composer-content-panel {
  border: 1px solid var(--q-grey-3);
  border-top: 0;
  border-radius: 0 0 8px 8px;
  background: color-mix(in srgb, var(--q-grey-1) 56%, white);
}

.composer-control-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  max-width: 100%;
}

.composer-preview-with-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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
</style>
