<template>
  <div>
    <div class="text-overline">Video Preview</div>
    <q-radio
      v-if="allowFrameMode"
      class="q-pl-sm"
      :model-value="previewType"
      val="frame"
      label="Video Frame"
      color="accent"
      :disable="disabled"
      @update:model-value="onUpdatePreviewType" />
    <q-radio
      v-if="allowFrameMode"
      class="q-pl-sm"
      :model-value="previewType"
      val="new"
      label="Upload Photo"
      data-cy="preview-type-upload"
      color="accent"
      :disable="disabled"
      @update:model-value="onUpdatePreviewType" />

    <q-file
      v-if="!allowFrameMode || previewType === 'new'"
      label="Preview Image"
      outlined
      :model-value="previewFile"
      accept="image/*"
      class="q-pb-md"
      color="accent"
      :disable="disabled"
      data-cy="preview-image-file"
      @update:model-value="onUpdatePreviewFile">
      <template v-slot:prepend>
        <q-icon name="image" @click.stop.prevent />
      </template>
      <template v-slot:append>
        <q-icon
          name="close"
          @click.stop.prevent="clearPreviewFile"
          class="cursor-pointer" />
      </template>
    </q-file>

    <div class="row items-center q-gutter-sm">
      <div v-if="showPreview" class="col-auto">
        <div
          class="preview-frame"
          :class="{ 'preview-frame-featured': showFeaturedBorder }"
          :style="{ width: previewWidth, aspectRatio: previewAspectRatio }">
          <MediaPreview
            v-if="previewImage"
            class="full-fit"
            :media="{ title: 'Video preview', preview: previewImage, main: showFeaturedBorder }"
            :interactive="false"
            :show-badges="false"
            :show-title-overlay="false" />
          <q-skeleton v-else type="rect" class="full-fit" animation="none" />
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          v-if="showRefreshButton && showPreview"
          :disable="disabled || !frameRefreshEnabled || previewProcessing"
          :loading="previewProcessing"
          icon="autorenew"
          flat
          size="xl"
          @click="emitRefreshFrame">
          <q-tooltip>Refresh Thumbnail</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div v-if="showRefreshButton && !showPreview" class="q-mt-sm">
      <q-btn
        color="primary"
        outline
        icon="autorenew"
        label="Pick Another Frame"
        :disable="disabled || !frameRefreshEnabled || previewProcessing"
        :loading="previewProcessing"
        @click="emitRefreshFrame" />
      <div class="text-caption text-grey-7 q-mt-xs">
        Generates a different frame from your video for the preview image.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'

const props = defineProps({
  previewType: {
    type: String,
    default: 'frame'
  },
  allowFrameMode: {
    type: Boolean,
    default: true
  },
  previewFile: {
    type: [File, Array, Object, null],
    default: null
  },
  previewImage: {
    type: String,
    default: null
  },
  previewWidth: {
    type: String,
    default: '250px'
  },
  previewAspectRatio: {
    type: String,
    default: '16 / 9'
  },
  showFeaturedBorder: {
    type: Boolean,
    default: false
  },
  previewProcessing: {
    type: Boolean,
    default: false
  },
  frameRefreshEnabled: {
    type: Boolean,
    default: true
  },
  showPreview: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:previewType', 'update:previewFile', 'refresh:frame'])

const showRefreshButton = computed(() => props.allowFrameMode && props.previewType === 'frame')

function onUpdatePreviewType(value) {
  emit('update:previewType', value)
}

function onUpdatePreviewFile(value) {
  emit('update:previewFile', value)
}

function clearPreviewFile() {
  emit('update:previewFile', null)
}

function emitRefreshFrame() {
  emit('refresh:frame')
}
</script>

<style scoped>
.full-fit {
  width: 100%;
  height: 100%;
}
.preview-frame {
  padding: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.preview-frame-featured {
  background: var(--q-accent);
}
</style>
