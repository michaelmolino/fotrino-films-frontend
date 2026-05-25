<template>
  <div class="composer-upload-focus" data-cy="upload-progress-overlay">
    <div class="composer-upload-preview-shell" :class="previewShellClass">
      <MediaPreview
        :media="media"
        :album="album"
        :detail="false"
        :interactive="false"
        class="composer-upload-preview" />
      <div class="composer-upload-overlay">
        <template v-if="isUploadingPhase">
          <q-circular-progress
            :indeterminate="isProgressIndeterminate"
            :value="progress"
            size="80px"
            color="accent"
            track-color="transparent"
            show-value
            class="composer-upload-spinner" />
          <div class="composer-upload-title q-mt-md">{{ uploadTitle }}</div>
          <div class="composer-upload-status q-mt-sm">{{ statusText }}</div>
        </template>
        <q-icon v-else name="check_circle" size="84px" color="positive" />
      </div>
    </div>
    <div
      v-if="isUploadingPhase"
      class="row q-col-gutter-sm items-center justify-center q-mt-md composer-upload-actions">
      <div class="col-auto" v-if="isUploading">
        <q-spinner-hourglass color="accent" size="1.35rem" />
      </div>
      <div class="col-auto" v-if="isUploading">
        <q-btn flat icon="cancel" color="negative" label="Cancel" @click="onCancelUpload" />
      </div>
      <div class="col-auto" v-else>
        <q-btn flat icon="refresh" label="Retry Upload" @click="onRetryUpload" />
      </div>
    </div>
    <q-banner v-else rounded class="bg-green-1 text-green-10 q-mt-md">
      <div class="text-subtitle2">Upload complete</div>
      <div>
        {{ media.title }} was uploaded successfully. We will email you when your video is live.
      </div>
    </q-banner>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'

const emit = defineEmits(['cancel-upload', 'start-upload-journey'])

const props = defineProps({
  uploadPhase: { type: String, required: true },
  payload: { type: Object, required: true },
  media: { type: Object, required: true },
  album: { type: Object, required: true },
  progress: { type: Number, required: true },
  statusText: { type: String, required: true },
  isUploading: { type: Boolean, required: true }
})

const isUploadingPhase = computed(() => props.uploadPhase === 'uploading')
const isProgressIndeterminate = computed(() => props.progress === -1)
const uploadTitle = computed(() => props.media.title || 'Uploading media')
const previewShellClass = computed(() => ({ 'is-featured': props.payload.album?.media?.main }))

function onCancelUpload() {
  emit('cancel-upload')
}

function onRetryUpload() {
  emit('start-upload-journey')
}
</script>

<style scoped>
.composer-upload-focus {
  max-width: 760px;
  margin: 0 auto;
}

.composer-upload-preview-shell {
  position: relative;
  width: 100%;
}

.composer-upload-preview-shell.is-featured {
  padding: 8px;
  background: var(--q-accent);
  box-sizing: border-box;
}

.composer-upload-preview {
  width: 100%;
}

.composer-upload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.42);
  color: #fff;
  pointer-events: none;
  text-align: center;
}

.composer-upload-spinner {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 8px;
}

.composer-upload-title {
  font-weight: 600;
  font-size: 1.08rem;
  max-width: min(560px, calc(100% - 48px));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.75);
}

.composer-upload-status {
  font-size: 0.92rem;
  opacity: 0.95;
  max-width: min(560px, calc(100% - 48px));
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.75);
}

.composer-upload-actions {
  width: 100%;
}
</style>
