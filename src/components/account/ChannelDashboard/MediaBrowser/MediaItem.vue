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
        <q-card-section class="row items-center q-gutter-md">
          <q-avatar square size="72px">
            <q-img v-if="media.preview" :src="media.preview" />
            <div v-else class="bg-grey-4" style="width: 100%; height: 100%" />
          </q-avatar>
          <div class="column justify-center">
            <div class="text-h6 text-weight-medium">{{ media.title }}</div>
          </div>
        </q-card-section>

        <q-card-section>
          <MediaMetadataFields
            :description="editForm.description"
            :resource-date="editForm.resourceDate"
            :main="!!editForm.main"
            @update:description="onUpdateDescription"
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
import { ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import { daysSince } from '@utils/date.js'
import MediaMetadataFields from '@components/account/shared/MediaMetadataFields.vue'

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

function saveEdit() {
  emit('editMedia', {
    id: props.media?.id,
    description: editForm.value.description,
    resourceDate: editForm.value.resourceDate,
    main: !!editForm.value.main
  })
  editDialog.value = false
}
</script>
