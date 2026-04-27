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
        :badge="channel.is_admin"
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
import { computed, ref, onBeforeUnmount } from 'vue'
import ResourceActions from './ResourceActions.vue'
import ProjectItem from './ProjectItem.vue'
import EditableChannelFields from '@components/account/shared/EditableChannelFields.vue'
import { daysSince } from '@utils/date.js'
import { useFileProcessor } from '@composables/useFileProcessor'

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
const editCoverFile = ref(null)
const editCoverPreview = ref(null)
const editCoverProcessing = ref(false)
const savingEdit = ref(false)

const { processFile } = useFileProcessor()

const hasChanges = computed(() => {
  return editForm.value.title !== props.channel.title || editCoverFile.value !== null
})

const openEditDialog = () => {
  editForm.value = {
    title: props.channel.title
  }
  editCoverFile.value = null
  editCoverPreview.value = null
  editDialog.value = true
}

const resetEditForm = () => {
  editForm.value = { title: '' }
  editCoverFile.value = null
  editCoverPreview.value = null
  editCoverProcessing.value = false
  savingEdit.value = false
}

const handleCoverFileSelected = async (file) => {
  if (!file) {
    editCoverFile.value = null
    editCoverPreview.value = null
    return
  }

  editCoverFile.value = file
  editCoverProcessing.value = true

  try {
    const processed = await processFile(file)
    editCoverPreview.value = URL.createObjectURL(processed)
  } finally {
    editCoverProcessing.value = false
  }
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

onBeforeUnmount(() => {
  if (editCoverPreview.value) {
    URL.revokeObjectURL(editCoverPreview.value)
  }
})
</script>
