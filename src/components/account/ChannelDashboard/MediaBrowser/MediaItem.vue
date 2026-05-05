<template>
  <div class="media-row">
    <ResourceActions
      :title="media.title"
      :image="media.preview"
      :pending="media.pending"
      :abortable="media.pending"
      :deleted="media.deleted"
      editable
      :link="getMediaLink('media', media.id)"
      :subtitle="media.created ? `Created: ${daysSince(media.created, true)}` : ''"
      delete-color="warning"
      @delete="$emit('deleteMedia', media.id)"
      @abort="$emit('abortMedia', media.id)"
      @edit="openEditDialog"
      square />

      <q-dialog v-model="editDialog" persistent data-cy="edit-media-dialog">
        <q-card style="min-width: 320px; width: 100%; max-width: 560px" data-cy="edit-media-dialog-card">
          <q-card-section>
            <div class="text-h6 text-weight-medium" data-cy="edit-media-dialog-title">{{ media.title }}</div>
          </q-card-section>

        <q-card-section>
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
            @update:previewFile="onUpdatePreviewFile"
            />

          <MediaMetadataFields
            :description="editForm.description"
            :resource-date="editForm.resourceDate"
            :main="!!editForm.main"
            :show-description="false"
            @update:resourceDate="onUpdateResourceDate"
            @update:main="onUpdateMain" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="editDialog = false" />
          <q-btn
            unelevated
            label="Save"
            color="accent"
            :loading="editPreviewProcessing"
            :disable="editPreviewProcessing"
            data-cy="edit-media-save"
            @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import { daysSince } from '@utils/date.js'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'
import MediaPreviewSelectorFields from '@components/account/shared/MediaPreviewSelectorFields.vue'
import { useProcessedImageFile } from '@composables/useProcessedImageFile.js'

const props = defineProps({
  media: Object,
  project: Object,
  channel: Object,
  getMediaLink: Function
})

const emit = defineEmits(['deleteMedia', 'editMedia', 'abortMedia'])

const editDialog = ref(false)
const editForm = ref({
  description: null,
  resourceDate: null,
  main: false
})
const editPreviewFile = ref(null)
const editPreviewImage = ref(null)
const {
  processing: editPreviewProcessing,
  processSelectedFile: processPreviewFile,
  reset: resetPreviewFile
} = useProcessedImageFile('preview')

function setLocalPreviewImage(url) {
  editPreviewImage.value = url || props.media?.preview || null
}

function normalizeResourceDate(raw) {
  if (!raw) return null
  if (typeof raw === 'string') {
    return raw.trim().slice(0, 10)
  }
  return null
}

function openEditDialog() {
  editForm.value = {
    description: props.media?.descriptionUnsafe ?? null,
    resourceDate: normalizeResourceDate(props.media?.resourceDate),
    main: !!props.media?.main
  }
  resetPreviewFile()
  editPreviewFile.value = null
  editPreviewImage.value = props.media?.preview || null
  editDialog.value = true
}

function onUpdateResourceDate(value) {
  editForm.value = {
    ...editForm.value,
    resourceDate: value ? value.replaceAll('/', '-') : value
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
    editPreviewImage.value = props.media?.preview || null
    return
  }

  const { file: processedFile, previewUrl } = await processPreviewFile(file)
  editPreviewFile.value = processedFile
  setLocalPreviewImage(previewUrl)
}

function saveEdit() {
  emit('editMedia', {
    id: props.media?.id,
    description: editForm.value.description,
    resourceDate: editForm.value.resourceDate,
    main: !!editForm.value.main,
    previewFile: editPreviewFile.value
  })
  editDialog.value = false
}
</script>
