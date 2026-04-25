<template>
  <div class="media-row">
    <ResourceActions
      :title="media.title"
      :image="media.preview"
      :pending="media.pending"
      :deleted="media.deleted"
      editable
      :link="getMediaLink('media', media.id)"
      :subtitle="media.created ? `Created: ${daysSince(media.created, true)}` : ''"
      delete-color="warning"
      @delete="$emit('deleteMedia', media.id)"
      @edit="openEditDialog"
      square />

      <q-dialog v-model="editDialog" persistent>
        <q-card style="min-width: 320px; width: 100%; max-width: 560px">
          <q-card-section>
            <div class="text-h6 text-weight-medium">{{ media.title }}</div>
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
          <q-btn unelevated label="Save" color="accent" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import { daysSince } from '@utils/date.js'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'
import MediaPreviewSelectorFields from '@components/account/shared/MediaPreviewSelectorFields.vue'
import { useFileProcessor } from '@composables/useFileProcessor.js'

const props = defineProps({
  media: Object,
  project: Object,
  channel: Object,
  getMediaLink: Function
})

const emit = defineEmits(['deleteMedia', 'editMedia'])

const editDialog = ref(false)
const editForm = ref({
  description: null,
  resourceDate: null,
  main: false
})
const editPreviewFile = ref(null)
const editPreviewImage = ref(null)
const localObjectUrl = ref(null)

const { handleFile: processFile } = useFileProcessor()

function clearLocalObjectUrl() {
  if (localObjectUrl.value) {
    URL.revokeObjectURL(localObjectUrl.value)
    localObjectUrl.value = null
  }
}

function setLocalPreviewImage(url) {
  clearLocalObjectUrl()
  if (url) {
    localObjectUrl.value = url
  }
  editPreviewImage.value = url || props.media?.preview || null
}

onBeforeUnmount(() => {
  clearLocalObjectUrl()
})

function normalizeResourceDate(raw) {
  if (!raw) return null
  if (typeof raw === 'string') {
    const normalized = raw.trim().replaceAll('-', '/')
    return normalized.slice(0, 10)
  }
  return null
}

function openEditDialog() {
  editForm.value = {
    description: props.media?.description_unsafe ?? null,
    resourceDate: normalizeResourceDate(props.media?.resource_date),
    main: !!props.media?.main
  }
  editPreviewFile.value = null
  editPreviewImage.value = props.media?.preview || null
  clearLocalObjectUrl()
  editDialog.value = true
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
    editPreviewFile.value = null
    clearLocalObjectUrl()
    editPreviewImage.value = props.media?.preview || null
    return
  }
  const processed = await processFile(file, 'preview')
  editPreviewFile.value = processed || file
  const previewUrl = URL.createObjectURL(editPreviewFile.value)
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
