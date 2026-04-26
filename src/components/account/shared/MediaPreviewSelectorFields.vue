<template>
  <div>
    <div class="text-overline">Media Preview</div>
    <q-radio
      v-if="allowFrameMode"
      class="q-pl-sm"
      :model-value="previewType"
      val="frame"
      label="Video Frame"
      color="accent"
      @update:model-value="$emit('update:previewType', $event)" />
    <q-radio
      v-if="allowFrameMode"
      class="q-pl-sm"
      :model-value="previewType"
      val="new"
      label="Upload Photo"
      data-cy="preview-type-upload"
      color="accent"
      @update:model-value="$emit('update:previewType', $event)" />

    <q-file
      v-if="!allowFrameMode || previewType === 'new'"
      label="Media Preview (Image)"
      outlined
      :model-value="previewFile"
      accept="image/*"
      class="q-pb-md"
      color="accent"
      data-cy="preview-image-file"
      @update:model-value="$emit('update:previewFile', $event)">
      <template v-slot:prepend>
        <q-icon name="image" @click.stop.prevent />
      </template>
      <template v-slot:append>
        <q-icon
          name="close"
          @click.stop.prevent="$emit('update:previewFile', null)"
          class="cursor-pointer" />
      </template>
    </q-file>

    <div class="row items-center q-gutter-sm">
      <div class="col-auto">
        <div
          class="preview-frame"
          :class="{ 'preview-frame-featured': showFeaturedBorder }"
          :style="{ width: previewWidth, aspectRatio: previewAspectRatio }">
          <q-img
            v-if="previewImage"
            :src="previewImage"
            class="cover full-fit"
            :ratio="16 / 9"
            fit="cover" />
          <q-skeleton v-else type="rect" class="full-fit" animation="none" />
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          v-if="allowFrameMode && previewType === 'frame'"
          :disable="!frameRefreshEnabled || previewProcessing"
          :loading="previewProcessing"
          icon="autorenew"
          flat
          size="xl"
          @click="$emit('refresh:frame')">
          <q-tooltip>Refresh Thumbnail</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
  }
})

defineEmits(['update:previewType', 'update:previewFile', 'refresh:frame'])
</script>

<style scoped>
.cover {
  object-fit: cover;
}
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
