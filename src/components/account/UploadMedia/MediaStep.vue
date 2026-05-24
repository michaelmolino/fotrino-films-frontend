<template>
  <div>
    <q-file
      label="Video *"
      outlined
      :model-value="mediaFile"
      accept="video/*"
      class="q-pb-md"
      color="accent"
      data-cy="upload-media-file"
      @update:model-value="onUpdateMediaFile"
      @rejected="onMediaFileRejected">
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
        :color="inputColor"
        class="q-pb-md"
        clearable
        :model-value="payload.album.media.title"
        label="Title *"
        data-cy="upload-media-title"
        @update:model-value="onUpdateMediaTitle" />
      <q-card flat bordered class="q-pb-md">
        <q-card-section>
          <MediaPreviewSelectorFields
            :preview-type="payload.album.media.previewType"
            :preview-file="previewFile"
            :preview-image="media?.preview || null"
            :show-featured-border="!!payload.album.media.main"
            :preview-processing="previewProcessing"
            :frame-refresh-enabled="!!mediaFile"
            @update:previewType="onUpdatePreviewType"
            @update:previewFile="onUpdatePreviewFile"
            @refresh:frame="emitCounterIncrement" />
        </q-card-section>
        <q-separator inset />
        <q-card-section>
          <MediaMetadataFields
            :description="payload.album.media.description"
            :resource-date="payload.album.media.resourceDate"
            :main="!!payload.album.media.main"
            :input-color="inputColor"
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
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'
import MediaPreviewSelectorFields from '@components/account/shared/MediaPreviewSelectorFields.vue'
const props = defineProps({
  payload: { type: Object, required: true },
  media: { type: Object, default: () => ({}) },
  mediaFile: { type: [File, Array], default: null },
  previewFile: { type: [File, Array], default: null },
  handleFile: { type: Function, default: null },
  previewProcessing: { type: Boolean, default: false }
})
const emit = defineEmits([
  'update:payload',
  'update:mediaFile',
  'update:previewFile',
  'increment:counter'
])

const $q = useQuasar()
const inputColor = computed(() => ($q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'))

function onUpdateMediaTitle(val) {
  emit('update:payload', {
    ...props.payload,
    album: { ...props.payload.album, media: { ...props.payload.album.media, title: val } }
  })
}
function onUpdateMediaDescription(val) {
  emit('update:payload', {
    ...props.payload,
    album: {
      ...props.payload.album,
      media: { ...props.payload.album.media, description: val }
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
        onUpdateResourceDate(`${yyyy}-${mm}-${dd}`)
      }
    } catch (e) {
      /* noop */
      console.debug(e)
    }
  }
  if (file && props.handleFile) props.handleFile(file, 'upload')
}
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
function onUpdatePreviewFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  emit('update:previewFile', file)
  if (file && props.handleFile) props.handleFile(file, 'preview')
}
function onUpdatePreviewType(val) {
  emit('update:payload', {
    ...props.payload,
    album: {
      ...props.payload.album,
      media: { ...props.payload.album.media, previewType: val }
    }
  })
  if (val !== 'new') {
    emitUpdatePreviewNull()
  }
}
function onUpdateResourceDate(val) {
  const normalized = val ? val.replaceAll('/', '-') : val
  emit('update:payload', {
    ...props.payload,
    album: {
      ...props.payload.album,
      media: { ...props.payload.album.media, resourceDate: normalized }
    }
  })
}
function onUpdateMediaMain(val) {
  emit('update:payload', {
    ...props.payload,
    album: {
      ...props.payload.album,
      media: { ...props.payload.album.media, main: !!val }
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

// Use composable for media metadata extraction
import { extractExifDate } from '@composables/useMediaMetadata.js'
</script>
