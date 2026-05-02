<template>
  <q-expansion-item
    :label="channel.title"
    group="channels"
    expand-icon-toggle
    expand-separator
    switch-toggle-side
    :disable="channel.pending">
    <template #header>
      <ResourceActions
        :title="channel.title"
        :image="channel.cover"
        :pending="channel.pending"
        :deleted="channel.deleted"
        :hasPending-children="hasPendingChildren"
        :link="getMediaLink('channel', channel.id)"
        :avatarSize="'48px'"
        :badge="channel.isAdmin"
        badgeIcon="security"
        :subtitle="channel.created ? `Created: ${daysSince(channel.created, true)}` : ''"
        :editable="true"
        :editDataCy="'edit-channel'"
        @edit="openEditDialog"
        @delete="$emit('deleteChannel', channel.uuid)" />
    </template>

    <ProjectItem
      v-for="project in channel.projects"
      :key="project.id"
      :project="project"
      :channel="channel"
      data-cy="project-item"
      @deleteProject="$emit('deleteProject', $event)"
      @deleteMedia="$emit('deleteMedia', $event)"
      @editProject="$emit('editProject', $event)"
      @editMedia="$emit('editMedia', $event)"
      :getMediaLink="getMediaLink" />

    <!-- Edit Channel Dialog -->
    <q-dialog v-model="editDialog" @before-hide="resetEditForm">
      <q-card style="min-width: 320px; width: 100%; max-width: 560px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit Channel</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <EditableChannelFields
            :title="editForm.title"
            :cover-preview="editCoverPreview || channel.cover"
            :cover-file="editCoverFile"
            :cover-processing="editCoverProcessing"
            @update:title="editForm.title = $event"
            @update:coverFile="handleCoverFileSelected" />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
            data-cy="cancel-edit-channel" />
          <q-btn
            flat
            label="Save"
            color="primary"
            :disable="editCoverProcessing || !hasChanges"
            :loading="savingEdit"
            @click="saveEdit"
            data-cy="save-edit-channel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-expansion-item>
</template>

<script setup>
import { computed, ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import ProjectItem from './ProjectItem.vue'
import EditableChannelFields from '@components/account/shared/EditableChannelFields.vue'
import { daysSince } from '@utils/date.js'
import { useProcessedImageFile } from '@composables/useProcessedImageFile.js'

const props = defineProps({
  channel: Object,
  getMediaLink: Function
})

const emit = defineEmits(['deleteChannel', 'deleteProject', 'deleteMedia', 'editMedia', 'editProject', 'editChannel'])

const hasPendingChildren = computed(() => {
  if (props.channel.projects?.some(project => project.pending)) {
    return true
  }
  return (
    props.channel.projects?.some(project => project.media?.some(media => media.pending)) || false
  )
})

// Edit state
const editDialog = ref(false)
const editForm = ref({
  title: ''
})
const {
  selectedFile: editCoverFile,
  processing: editCoverProcessing,
  processSelectedFile: processCoverFile,
  reset: resetCoverFile
} = useProcessedImageFile('cover')
const editCoverPreview = ref(null)
const savingEdit = ref(false)

const hasChanges = computed(() => {
  return editForm.value.title !== props.channel.title || editCoverFile.value !== null
})

const openEditDialog = () => {
  editForm.value = {
    title: props.channel.title
  }
  resetCoverFile()
  editCoverPreview.value = null
  editDialog.value = true
}

const resetEditForm = () => {
  editForm.value = { title: '' }
  resetCoverFile()
  editCoverPreview.value = null
  savingEdit.value = false
}

const handleCoverFileSelected = async (file) => {
  if (!file) {
    resetCoverFile()
    editCoverPreview.value = null
    return
  }

  const { file: processedFile, previewUrl } = await processCoverFile(file)
  editCoverFile.value = processedFile
  editCoverPreview.value = previewUrl
}

const saveEdit = () => {
  savingEdit.value = true
  try {
    const payload = {
      channelUuid: props.channel.uuid,
      title: editForm.value.title,
      coverFile: editCoverFile.value
    }
    emit('editChannel', payload)
    editDialog.value = false
  } finally {
    savingEdit.value = false
  }
}
</script>
