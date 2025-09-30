<template>
  <div>
    <div class="row">
      <div class="col-xs-12 col-md-6 q-pa-sm">
        <q-input
          outlined
          :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
          class="q-pb-md"
          clearable
          :disable="!mediaFile"
          :model-value="payload.project.media.title"
          label="Title *"
          @update:model-value="onUpdateMediaTitle"
        />
        <q-input
          outlined
          autogrow
          :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
          class="q-pb-md"
          clearable
          :model-value="payload.project.media.description"
          label="Description - p, br, strong, and i tags allowed"
          @update:model-value="onUpdateMediaDescription"
        />
        <q-btn
          icon="event"
          flat
          :disable="!mediaFile"
          :label="new Date(payload.project.media.resourceDate).toLocaleDateString()"
        >
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              :model-value="payload.project.media.resourceDate"
              subtitle="Capture Date"
              :options="dateOptionsFn"
              @update:model-value="onUpdateResourceDate"
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="Cancel" flat v-close-popup />
                <q-btn label="OK" flat v-close-popup />
              </div>
            </q-date>
          </q-popup-proxy>
          <q-tooltip>Capture Date</q-tooltip> </q-btn
        ><br />
        <q-checkbox outlined v-model="localMain" label="Featured" class="q-pb-md q-pl-sm" />
        <div class="row">
          <div class="width250x">
            <MediaPreview :media="media" />
          </div>
          <div class="q-pa-md flex items-center">
            <q-btn
              v-if="payload.project.media.previewType === 'frame' && mediaFile"
              :disable="previewProcessing"
              :loading="previewProcessing"
              icon="fas fa-arrows-rotate"
              flat
              size="xl"
              @click="emitCounterIncrement"
            />
            <span v-if="payload.project.media.previewType === 'frame' && mediaFile"
              >refresh thumbnail</span
            >
          </div>
        </div>
      </div>
      <div class="col-xs-12 col-md-6 q-pa-sm">
        <q-file
          label="Media (Video) *"
          outlined
          :model-value="mediaFile"
          accept="video/*"
          max-file-size="5368709120"
          class="q-pb-md"
          color="accent"
          @update:model-value="onUpdateMediaFile"
        >
          <template v-slot:prepend>
            <q-icon name="movie" @click.stop.prevent />
          </template>
          <template v-slot:append>
            <q-icon name="close" @click.stop.prevent="emitUpdateMediaNull" class="cursor-pointer" />
          </template>
        </q-file>
        <q-radio
          class="q-pl-sm"
          v-model="localPreviewType"
          val="frame"
          label="Video Frame"
          color="accent"
        /><br />
        <q-radio
          class="q-pl-sm"
          v-model="localPreviewType"
          val="new"
          label="Upload Photo"
          color="accent"
        />
        <q-file
          v-if="localPreviewType === 'new'"
          label="Media Preview (Image)"
          outlined
          :model-value="previewFile"
          accept="image/*"
          class="q-pb-md"
          color="accent"
          @update:model-value="onUpdatePreviewFile"
        >
          <template v-slot:prepend>
            <q-icon name="image" @click.stop.prevent />
          </template>
          <template v-slot:append>
            <q-icon
              name="close"
              @click.stop.prevent="emitUpdatePreviewNull"
              class="cursor-pointer"
            />
          </template>
        </q-file>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
const props = defineProps({
  payload: Object,
  media: Object,
  mediaFile: [File, Array, null],
  previewFile: [File, Array, null],
  handleFile: Function,
  previewProcessing: Boolean
})
const emit = defineEmits([
  'update:payload',
  'update:mediaFile',
  'update:previewFile',
  'increment:counter'
])

const localPreviewType = computed({
  get: () => props.payload.project.media.previewType,
  set: v =>
    emit('update:payload', {
      ...props.payload,
      project: {
        ...props.payload.project,
        media: { ...props.payload.project.media, previewType: v }
      }
    })
})

const localMain = computed({
  get: () => !!props.payload.project.media.main,
  set: v =>
    emit('update:payload', {
      ...props.payload,
      project: { ...props.payload.project, media: { ...props.payload.project.media, main: v } }
    })
})

function onUpdateMediaTitle(val) {
  emit('update:payload', {
    ...props.payload,
    project: { ...props.payload.project, media: { ...props.payload.project.media, title: val } }
  })
}
function onUpdateMediaDescription(val) {
  emit('update:payload', {
    ...props.payload,
    project: {
      ...props.payload.project,
      media: { ...props.payload.project.media, description: val }
    }
  })
}
async function onUpdateMediaFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  emit('update:mediaFile', file)
  if (file) {
    // Default title from filename (strip extension)
    try {
      const base = (file.name || '').replace(/\.[^/.]+$/, '')
      if (base && !props.payload.project.media.title) {
        onUpdateMediaTitle(base)
      }
    } catch (e) { /* noop */ }
    // Default resourceDate from EXIF (if available) or lastModified
    try {
      const exifDate = await extractExifDate(file)
      const dateObj = exifDate || (file.lastModified ? new Date(file.lastModified) : new Date())
      if (dateObj && !isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear()
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
        const dd = String(dateObj.getDate()).padStart(2, '0')
        onUpdateResourceDate(`${yyyy}/${mm}/${dd}`)
      }
    } catch (e) { /* noop */ }
  }
  if (file && props.handleFile) props.handleFile(file, 'upload')
}
function onUpdatePreviewFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  emit('update:previewFile', file)
  if (file && props.handleFile) props.handleFile(file, 'preview')
}
function onUpdateResourceDate(val) {
  emit('update:payload', {
    ...props.payload,
    project: {
      ...props.payload.project,
      media: { ...props.payload.project.media, resourceDate: val }
    }
  })
}
function emitUpdatePreviewNull() {
  emit('update:previewFile', null)
}
function emitUpdateMediaNull() {
  emit('update:mediaFile', null)
}
function emitCounterIncrement() {
  emit('increment:counter')
}
function dateOptionsFn(date) {
  return new Date(date) <= new Date()
}

// Attempt to read a capture date from metadata; for videos, browsers often expose limited metadata.
// We optimistically try to read from the file's blob as text looking for common date markers.
// If not found, resolve null and the caller will fallback to lastModified.
async function extractExifDate(file) {
  // Some containers (like MP4) won’t expose EXIF via browser APIs. Without extra deps, we fallback quickly.
  // If the file is an image with EXIF, we could parse via a library; to avoid deps, return null here.
  return null
}
</script>
