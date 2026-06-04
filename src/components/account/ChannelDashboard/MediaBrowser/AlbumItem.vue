<template>
  <div>
    <q-expansion-item
      :label="album.title"
      :header-inset-level="0.5"
      :content-inset-level="1"
      group="albums"
      expand-icon-toggle
      expand-separator
      switch-toggle-side
      :disable="album.pending">
      <template #header>
        <ResourceActions
          :title="album.title"
          :image="album.posterAsset"
          :color="album.posterColor || '#000000'"
          :pending="album.pending"
          :deleted="album.deleted"
          :undeletable="album.deleted"
          :hasPending-children="hasPendingChildren"
          :link="getMediaLink('album', album)"
          :avatarSize="'40px'"
          :subtitle="albumSubtitle"
          editable
          edit-data-cy="edit-album"
          delete-data-cy="delete-album"
          @edit="openEditDialog"
          @delete="emitDeleteAlbum"
          @undelete="emitUndeleteAlbum" />
      </template>

      <MediaItem
        v-for="media in album.media"
        :key="media.privateId"
        :media="media"
        :album="album"
        :channel="channel"
        data-cy="media-item"
        :getMediaLink="getMediaLink"
        v-on="mediaItemListeners" />
    </q-expansion-item>

    <q-dialog v-model="editDialog" no-backdrop-dismiss data-cy="edit-album-dialog">
      <q-card
        style="min-width: 320px; width: 100%; max-width: 560px"
        data-cy="edit-album-dialog-card">
        <q-card-section>
          <div class="text-h6 text-weight-medium" data-cy="edit-album-dialog-title">
            {{ album.title }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            outlined
            clearable
            class="q-pb-md"
            :model-value="editForm.title"
            label="Album Title"
            data-cy="album-title-input"
            @update:model-value="onUpdateTitle" />
          <AlbumPosterFields
            :subtitle="editForm.subtitle"
            subtitle-label="Album SubTitle"
            :poster-type="editForm.posterType"
            :poster-color="editForm.posterColor"
            :poster-file="editPosterFile"
            :album-preview="editAlbumPreview"
            subtitle-data-cy="album-subtitle-input"
            poster-type-default-data-cy="album-poster-type-default"
            poster-type-new-data-cy="album-poster-type-new"
            poster-file-data-cy="album-poster-file"
            poster-color-button-data-cy="album-poster-color"
            poster-preview-data-cy="album-poster-preview"
            @update:subtitle="onUpdateSubtitle"
            @update:posterType="onUpdatePosterType"
            @update:posterColor="onUpdatePosterColor"
            @update:posterFile="onUpdatePosterFile" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="accent" @click="editDialog = false" />
          <q-btn
            unelevated
            label="Save"
            color="accent"
            data-cy="edit-album-save"
            :loading="editPosterProcessing"
            :disable="editPosterProcessing"
            @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import MediaItem from './MediaItem.vue'
import { daysSince } from '@utils/date.js'
import AlbumPosterFields from '@components/account/shared/AlbumPosterFields.vue'
import { useImageSelectionProcessing } from '@composables/useImageFileProcessor.js'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

const props = defineProps({
  album: Object,
  channel: Object,
  getMediaLink: Function
})

const emit = defineEmits([
  'deleteAlbum',
  'undeleteAlbum',
  'deleteMedia',
  'undeleteMedia',
  'abortMedia',
  'editMedia',
  'editAlbum'
])

const editDialog = ref(false)
const {
  selectedFile: editPosterFile,
  processing: editPosterProcessing,
  setAndCompressImage: processPosterFile,
  reset: resetPosterFile
} = useImageSelectionProcessing()
const editForm = ref({
  title: '',
  subtitle: null,
  posterType: 'default',
  posterColor: '#000000',
  posterImage: null
})

const hasPendingChildren = computed(() => {
  for (const media of props.album.media || []) {
    if (media?.pending) {
      return true
    }
  }
  return false
})
const albumSubtitle = computed(() =>
  props.album.created ? `Created: ${daysSince(props.album.created, true)}` : ''
)

const mediaItemListeners = {
  deleteMedia: value => emit('deleteMedia', value),
  undeleteMedia: value => emit('undeleteMedia', value),
  abortMedia: value => emit('abortMedia', value),
  editMedia: value => emit('editMedia', value)
}

function emitDeleteAlbum() {
  emit('deleteAlbum', { privateId: props.album.privateId, publicId: props.album.publicId })
}

function emitUndeleteAlbum() {
  emit('undeleteAlbum', { privateId: props.album.privateId, publicId: props.album.publicId })
}

const editAlbumPreview = computed(() => {
  return {
    title: editForm.value.title || props.album?.title || '',
    subtitle: editForm.value.subtitle || '',
    poster: editForm.value.posterType === 'new' ? editForm.value.posterImage : null,
    posterColor: editForm.value.posterColor || '#000000',
    media: Array.isArray(props.album?.media) ? props.album.media : []
  }
})

function openEditDialog() {
  const persistedPoster = resolveImagePrimaryUrl(props.album?.posterAsset)
  editForm.value = {
    title: props.album?.title ?? '',
    subtitle: props.album?.subtitle ?? null,
    posterType: persistedPoster ? 'new' : 'default',
    posterColor: props.album?.posterColor || '#000000',
    posterImage: persistedPoster || null
  }
  resetPosterFile()
  editDialog.value = true
}

function onUpdateTitle(value) {
  editForm.value = {
    ...editForm.value,
    title: value
  }
}

function onUpdateSubtitle(value) {
  editForm.value = {
    ...editForm.value,
    subtitle: value
  }
}

function onUpdatePosterType(value) {
  if (value === 'default') {
    resetPosterFile()
    editForm.value = {
      ...editForm.value,
      posterType: 'default',
      posterImage: null
    }
    return
  }

  editForm.value = {
    ...editForm.value,
    posterType: 'new',
    posterImage: editForm.value.posterImage || resolveImagePrimaryUrl(props.album?.posterAsset) || null
  }
}

function onUpdatePosterColor(value) {
  editForm.value = {
    ...editForm.value,
    posterColor: value
  }
}

async function onUpdatePosterFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  const persistedPoster = resolveImagePrimaryUrl(props.album?.posterAsset)
  if (!file) {
    resetPosterFile()
    editForm.value = {
      ...editForm.value,
      posterImage: persistedPoster || null
    }
    return
  }

  const { file: processedFile, previewUrl } = await processPosterFile(file)
  editForm.value = {
    ...editForm.value,
    posterType: 'new',
    posterImage: previewUrl
  }
  editPosterFile.value = processedFile
}

function saveEdit() {
  emit('editAlbum', {
    privateId: props.album?.privateId,
    publicId: props.album?.publicId,
    title: editForm.value.title,
    subtitle: editForm.value.subtitle,
    posterType: editForm.value.posterType,
    posterColor: editForm.value.posterColor,
    posterFile: editPosterFile.value
  })
  editDialog.value = false
}
</script>

<style scoped>
@media (max-width: 959px) {
  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 16px;
  }
}
</style>
