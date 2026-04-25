<template>
  <div>
    <q-file
      label="Media (Video) *"
      outlined
      :model-value="mediaFile"
      accept="video/*"
      max-file-size="5368709120"
      class="q-pb-md"
      color="accent"
      @update:model-value="onUpdateMediaFile">
      <template v-slot:prepend>
        <q-icon name="movie" @click.stop.prevent />
      </template>
      <template v-slot:append>
        <q-icon name="close" @click.stop.prevent="emitUpdateMediaNull" class="cursor-pointer" />
      </template>
    </q-file>
    <div v-if="mediaFile">
      <q-input
        outlined
        :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
        class="q-pb-md"
        clearable
        :model-value="payload.project.media.title"
        label="Title *"
        @update:model-value="onUpdateMediaTitle" />
      <q-card flat bordered class="q-pb-md">
        <q-card-section>
          <div class="text-overline">Media Preview</div>
          <q-radio
            class="q-pl-sm"
            v-model="localPreviewType"
            val="frame"
            label="Video Frame"
            color="accent" />
          <q-radio
            class="q-pl-sm"
            v-model="localPreviewType"
            val="new"
            label="Upload Photo"
            color="accent" />
          <q-file
            v-if="localPreviewType === 'new'"
            label="Media Preview (Image)"
            outlined
            :model-value="previewFile"
            accept="image/*"
            class="q-pb-md"
            color="accent"
            @update:model-value="onUpdatePreviewFile">
            <template v-slot:prepend>
              <q-icon name="image" @click.stop.prevent />
            </template>
            <template v-slot:append>
              <q-icon
                name="close"
                @click.stop.prevent="emitUpdatePreviewNull"
                class="cursor-pointer" />
            </template>
          </q-file>
          <div class="row items-center q-gutter-sm">
            <div class="col-auto">
              <div class="width250">
                <MediaPreview :media="media" />
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                v-if="payload.project.media.previewType === 'frame' && mediaFile"
                :disable="previewProcessing"
                :loading="previewProcessing"
                icon="autorenew"
                flat
                size="xl"
                @click="emitCounterIncrement">
                <q-tooltip>Refresh Thumbnail</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
        <q-separator inset />
        <q-card-section>
          <MediaMetadataFields
            :description="payload.project.media.description"
            :resource-date="payload.project.media.resourceDate"
            :main="!!payload.project.media.main"
            :input-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
            @update:description="onUpdateMediaDescription"
            @update:resourceDate="onUpdateResourceDate"
            @update:main="onUpdateMediaMain" />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import MediaPreview from '@components/channel/MediaPreview.vue'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'
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

const $q = useQuasar()

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
      if (base) {
        onUpdateMediaTitle(base)
      }
    } catch (e) {
      /* noop */
      console.debug(e)
    }
    // Default resourceDate from EXIF (if available) or lastModified
    try {
      const exifDate = await extractExifDate(file)
      const dateObj = exifDate || (file.lastModified ? new Date(file.lastModified) : new Date())
      if (dateObj && !Number.isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear()
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
        const dd = String(dateObj.getDate()).padStart(2, '0')
        onUpdateResourceDate(`${yyyy}/${mm}/${dd}`)
      }
    } catch (e) {
      /* noop */
      console.debug(e)
    }
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
function onUpdateMediaMain(val) {
  emit('update:payload', {
    ...props.payload,
    project: {
      ...props.payload.project,
      media: { ...props.payload.project.media, main: !!val }
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

// Attempt to read a capture date from metadata; for videos, browsers often expose limited metadata.
// We optimistically try to read from the file's blob as text looking for common date markers.
// If not found, resolve null and the caller will fallback to lastModified.
async function extractExifDate(file) {
  // Some containers (like MP4) won’t expose EXIF via browser APIs. Without extra deps, we fallback quickly.
  // If the file is an image with EXIF, we could parse via a library; to avoid deps, return null here.
  console.debug(file)
  return null
}
</script>
