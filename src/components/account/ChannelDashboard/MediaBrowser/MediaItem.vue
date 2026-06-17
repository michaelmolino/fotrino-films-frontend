<template>
  <div class="media-row">
    <ResourceActions
      :title="media.title"
      :image="media.previewAsset"
      :pending="media.pending"
      :abortable="media.pending"
      :abortInProgress="abortInProgress"
      :deleted="media.deleted"
      undeletable
      editable
      :link="getMediaLink('media', media)"
      :subtitle="mediaSubtitle"
      delete-color="warning"
      @delete="emitDeleteMedia"
      @undelete="emitUndeleteMedia"
      @abort="emitAbortMedia"
      @edit="openEditDialog"
      square />

    <q-dialog v-model="editDialog" no-backdrop-dismiss data-cy="edit-media-dialog">
      <q-card
        style="min-width: 320px; width: 100%; max-width: 560px"
        data-cy="edit-media-dialog-card">
        <q-card-section>
          <div class="text-h6 text-weight-medium" data-cy="edit-media-dialog-title">
            {{ media.title }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            outlined
            clearable
            class="q-pb-md"
            :model-value="editForm.title"
            label="Video Title"
            data-cy="edit-media-title-input"
            @update:model-value="onUpdateTitle" />
          <MediaMetadataFields
            :description="editForm.description"
            :resource-date="editForm.resourceDate"
            :main="!!editForm.main"
            :show-extended-attributes="false"
            @update:description="onUpdateDescription"
            @update:resourceDate="onUpdateResourceDate"
            @update:main="onUpdateMain" />

          <MediaPreviewSelectorFields
            :allow-frame-mode="false"
            :preview-file="editPreviewFile"
            :preview-image="editPreviewImage"
            :show-featured-border="!!editForm.main"
            :preview-processing="false"
            :frame-refresh-enabled="false"
            @update:previewFile="onUpdatePreviewFile" />

          <MediaMetadataFields
            :description="editForm.description"
            :resource-date="editForm.resourceDate"
            :main="!!editForm.main"
            :show-description="false"
            @update:resourceDate="onUpdateResourceDate"
            @update:main="onUpdateMain" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="accent"
            :disable="savingEdit"
            @click="editDialog = false" />
          <q-btn
            unelevated
            label="Save"
            color="accent"
            :loading="savingEdit || editPreviewProcessing"
            :disable="savingEdit || editPreviewProcessing"
            data-cy="edit-media-save"
            @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import { daysSince } from '@utils/date.js'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'
import MediaPreviewSelectorFields from '@components/account/shared/MediaPreviewSelectorFields.vue'
import { useImageSelectionProcessing } from '@composables/useImageFileProcessor.js'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

const props = defineProps({
  media: Object,
  album: Object,
  channel: Object,
  abortInProgress: {
    type: Boolean,
    default: false
  },
  getMediaLink: Function
})

const emit = defineEmits(['deleteMedia', 'undeleteMedia', 'editMedia', 'abortMedia'])

const editDialog = ref(false)
const savingEdit = ref(false)
const editForm = ref({
  title: '',
  description: null,
  resourceDate: null,
  main: false
})
const editPreviewFile = ref(null)
const editPreviewImage = ref(null)
const {
  processing: editPreviewProcessing,
  setAndCompressImage: processPreviewFile,
  reset: resetPreviewFile
} = useImageSelectionProcessing()
const mediaSubtitle = computed(() =>
  props.media.created ? `Created: ${daysSince(props.media.created, true)}` : ''
)

function emitDeleteMedia() {
  emit('deleteMedia', {
    channelPublicId: props.channel?.publicId,
    privateId: props.media.privateId,
    publicId: props.media.publicId
  })
}

function emitUndeleteMedia() {
  emit('undeleteMedia', {
    channelPublicId: props.channel?.publicId,
    privateId: props.media.privateId,
    publicId: props.media.publicId
  })
}

function emitAbortMedia() {
  emit('abortMedia', props.media.privateId)
}

function setLocalPreviewImage(url) {
  editPreviewImage.value = url || resolveImagePrimaryUrl(props.media?.previewAsset) || null
}

function toResourceDate(raw) {
  return raw ? raw.slice(0, 10) : null
}

function openEditDialog() {
  editForm.value = {
    title: props.media?.title ?? '',
    description: props.media?.descriptionUnsafe ?? null,
    resourceDate: toResourceDate(props.media?.resourceDate),
    main: !!props.media?.main
  }
  resetPreviewFile()
  editPreviewFile.value = null
  editPreviewImage.value = resolveImagePrimaryUrl(props.media?.previewAsset) || null
  editDialog.value = true
}

function onUpdateTitle(value) {
  editForm.value = {
    ...editForm.value,
    title: value
  }
}

function onUpdateResourceDate(value) {
  editForm.value = {
    ...editForm.value,
    resourceDate: value
  }
}

function onUpdateDescription(value) {
  editForm.value = {
    ...editForm.value,
    description: value
  }
}

function onUpdateMain(value) {
  editForm.value = {
    ...editForm.value,
    main: !!value
  }
}

async function onUpdatePreviewFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  if (!file) {
    resetPreviewFile()
    editPreviewFile.value = null
    editPreviewImage.value = resolveImagePrimaryUrl(props.media?.previewAsset) || null
    return
  }

  const { file: processedFile, previewUrl } = await processPreviewFile(file)
  editPreviewFile.value = processedFile
  setLocalPreviewImage(previewUrl)
}

async function saveEdit() {
  savingEdit.value = true
  try {
    await new Promise((resolve, reject) => {
      emit('editMedia', {
        channelPublicId: props.channel?.publicId,
        privateId: props.media?.privateId,
        publicId: props.media?.publicId,
        title: editForm.value.title,
        description: editForm.value.description,
        resourceDate: editForm.value.resourceDate,
        main: !!editForm.value.main,
        previewFile: editPreviewFile.value,
        resolve,
        reject
      })
    })
    editDialog.value = false
  } catch {
    // error already shown by parent via notify
  } finally {
    savingEdit.value = false
  }
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
