<template>
  <div>
    <q-select
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      label="Album *"
      :model-value="payload.album.id"
      @update:model-value="onUpdateAlbumId"
      :options="filteredOptions"
      data-cy="upload-album-select"
      class="q-pb-md" />
    <q-input
      v-if="payload.album.id?.value === 0"
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      class="q-pb-md"
      clearable
      :model-value="payload.album.title"
      label="Album Title *"
      data-cy="upload-album-title"
      @update:model-value="onUpdateAlbumTitle"
      @focus="clearDefaultAlbumTitle"
      @blur="restoreDefaultAlbumTitle" />
    <q-card v-if="payload.album.id?.value !== 0" flat bordered class="q-pb-md">
      <q-card-section>
        <div class="text-overline">Album Poster</div>
        <div class="width250" data-cy="upload-album-poster-preview-existing">
          <AlbumPoster v-if="displayAlbum" :album="displayAlbum" />
          <q-skeleton
            v-else
            class="cursor-not-allowed"
            style="width: 250px; height: 375px"
            animation="none" />
        </div>
      </q-card-section>
    </q-card>
    <q-card v-if="payload.album.id?.value === 0" flat bordered class="q-pb-md">
      <q-card-section>
        <AlbumPosterFields
          :subtitle="payload.album.subtitle"
          :input-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
          :show-subtitle="true"
          :show-poster-type="true"
          :poster-type="localPosterType"
          :poster-color="payload.album.posterColor || defaultColor"
          :poster-file="posterFile"
          :album-preview="displayAlbum"
          subtitle-data-cy="upload-album-subtitle"
          poster-type-default-data-cy="upload-album-poster-type-default"
          poster-type-new-data-cy="upload-album-poster-type-new"
          poster-file-data-cy="upload-album-poster-file"
          poster-color-button-data-cy="upload-album-poster-color"
          poster-preview-data-cy="upload-album-poster-preview"
          @update:subtitle="onUpdateAlbumSubtitle"
          @update:posterType="onUpdatePosterType"
          @update:posterColor="onUpdatePosterColor"
          @update:posterFile="onUpdatePosterFile" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import AlbumPoster from '@components/channel/shared/AlbumPoster.vue'
import AlbumPosterFields from '@components/account/shared/AlbumPosterFields.vue'
const props = defineProps({
  payload: { type: Object, required: true },
  albums: { type: Array, default: () => [] },
  album: { type: Object, default: () => ({}) },
  posterFile: { type: [File, Array], default: null },
  handleFile: { type: Function, default: null }
})
const emit = defineEmits(['update:payload', 'update:posterFile'])
const defaultColor = '#000000'

// Filter albums that are eligible for the currently selected channel.
// Parent now syncs albums per-channel, but keep this defensive.
const filteredOptions = computed(() => {
  const list = Array.isArray(props.albums) ? props.albums : []
  return list
    .map(({ id, title }) => ({ value: id, label: title }))
    .concat({ value: 0, label: 'New...' })
})

const localPosterType = computed(() => props.payload.album.posterType)

// Use payload.album for preview when creating a new album (id === 0),
// otherwise use the existing album prop. This ensures posterColor updates
// are reflected in the live preview.
const displayAlbum = computed(() => {
  const currentId = props.payload?.album?.id

  // If id is undefined (no selection made), return null to show skeleton
  if (currentId === undefined) {
    return null
  }

  const isNew = currentId?.value === 0
  const base = isNew ? props.payload.album || {} : props.album || {}
  const parentAlbum = props.album || {}

  // For new albums, posterColor should come from payload
  // For existing albums, posterColor should come from the album data
  const posterColor = isNew
    ? props.payload?.album?.posterColor || defaultColor
    : parentAlbum.posterColor || defaultColor

  return {
    // Prefer parent-computed media array (reflects current poster/media counts)
    media: Array.isArray(parentAlbum.media) ? parentAlbum.media : [],
    // Prefer parent-computed poster (e.g., posterThumb for uploads), else none
    poster: parentAlbum.poster || null,
    // Live title/subtitle from payload when creating new, fallback to parent when needed
    title: base.title || parentAlbum.title || '',
    subtitle: base.subtitle || parentAlbum.subtitle || '',
    // Use the appropriate poster color based on whether it's a new or existing album
    posterColor: posterColor
  }
})

function onUpdateAlbumId(val) {
  emit('update:payload', { ...props.payload, album: { ...props.payload.album, id: val } })
}
function onUpdateAlbumTitle(val) {
  emit('update:payload', { ...props.payload, album: { ...props.payload.album, title: val } })
}
function onUpdateAlbumSubtitle(val) {
  emit('update:payload', {
    ...props.payload,
    album: { ...props.payload.album, subtitle: val }
  })
}
function onUpdatePosterType(val) {
  emit('update:payload', {
    ...props.payload,
    album: { ...props.payload.album, posterType: val }
  })
  if (val !== 'new') {
    emitUpdatePosterNull()
  }
}
function onUpdatePosterColor(val) {
  emit('update:payload', {
    ...props.payload,
    album: { ...props.payload.album, posterColor: val }
  })
}
function onUpdatePosterFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  emit('update:posterFile', file)
  if (file && props.handleFile) props.handleFile(file, 'poster')
}
function emitUpdatePosterNull() {
  emit('update:posterFile', null)
}
function clearDefaultAlbumTitle() {
  emit('update:payload', { ...props.payload, album: { ...props.payload.album, title: '' } })
}
function restoreDefaultAlbumTitle() {
  if (props.payload.album.title === '') {
    emit('update:payload', {
      ...props.payload,
      album: { ...props.payload.album, title: 'My Videos' }
    })
  }
}

// Default selection behavior based on available albums:
// - 0 albums: default to New... (value 0)
// - 1 album: default to that album
// - >1 albums: leave blank to force explicit selection
function ensureDefaultAlbumSelection() {
  const list = Array.isArray(props.albums) ? props.albums : []
  const current = props.payload?.album?.id
  const albumIdSet = new Set(list.map(album => album.id))

  if (list.length === 0) {
    // No albums available, default to New...
    if (!current || current.value !== 0) {
      emit('update:payload', {
        ...props.payload,
        album: { ...props.payload.album, id: { value: 0, label: 'New...' } }
      })
    }
  } else if (list.length === 1) {
    // Only one album, auto-select it
    const { id, title } = list[0]
    if (!current || current.value !== id) {
      emit('update:payload', {
        ...props.payload,
        album: { ...props.payload.album, id: { value: id, label: title } }
      })
    }
  } else {
    // Multiple albums, force blank selection unless user has made a valid choice
    const hasValidSelection = current && albumIdSet.has(current.value)
    if (!hasValidSelection && (!current || current.value === 0)) {
      emit('update:payload', {
        ...props.payload,
        album: { ...props.payload.album, id: undefined }
      })
    }
  }
}

onMounted(() => ensureDefaultAlbumSelection())
watch(
  () => (props.albums || []).length,
  () => ensureDefaultAlbumSelection()
)
</script>
