<template>
  <div>
    <q-expansion-item
      :label="project.title"
      :header-inset-level="0.5"
      :content-inset-level="1"
      group="projects"
      expand-icon-toggle
      expand-separator
      switch-toggle-side
      :disable="project.pending">
      <template #header>
        <ResourceActions
          :title="project.title"
          :image="project.poster"
          :color="project.poster_color || '#000000'"
          :pending="project.pending"
          :deleted="project.deleted"
          :hasPending-children="hasPendingChildren"
          :link="getMediaLink('project', project.id)"
          :avatarSize="'40px'"
          :subtitle="project.created ? `Created: ${daysSince(project.created, true)}` : ''"
          editable
          edit-data-cy="edit-project"
          @edit="openEditDialog"
          @delete="$emit('deleteProject', project.id)" />
      </template>

      <MediaItem
        v-for="media in project.media"
        :key="media.id"
        :media="media"
        :project="project"
        :channel="channel"
        data-cy="media-item"
        :getMediaLink="getMediaLink"
        @deleteMedia="$emit('deleteMedia', $event)"
        @editMedia="$emit('editMedia', $event)" />
    </q-expansion-item>

    <q-dialog v-model="editDialog" persistent data-cy="edit-project-dialog">
      <q-card style="min-width: 320px; width: 100%; max-width: 560px" data-cy="edit-project-dialog-card">
        <q-card-section>
          <div class="text-h6 text-weight-medium" data-cy="edit-project-dialog-title">{{ project.title }}</div>
        </q-card-section>

        <q-card-section>
          <ProjectPosterFields
            :subtitle="editForm.subtitle"
            subtitle-label="Project SubTitle"
            :poster-type="editForm.posterType"
            :poster-color="editForm.posterColor"
            :poster-file="editPosterFile"
            :project-preview="editProjectPreview"
            subtitle-data-cy="project-subtitle-input"
            poster-type-default-data-cy="project-poster-type-default"
            poster-type-new-data-cy="project-poster-type-new"
            poster-file-data-cy="project-poster-file"
            poster-color-button-data-cy="project-poster-color"
            poster-preview-data-cy="project-poster-preview"
            @update:subtitle="onUpdateSubtitle"
            @update:posterType="onUpdatePosterType"
            @update:posterColor="onUpdatePosterColor"
            @update:posterFile="onUpdatePosterFile" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="editDialog = false" />
          <q-btn
            unelevated
            label="Save"
            color="accent"
            data-cy="edit-project-save"
            :loading="editPosterProcessing"
            :disable="editPosterProcessing"
            @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import ResourceActions from './ResourceActions.vue'
import MediaItem from './MediaItem.vue'
import { daysSince } from '@utils/date.js'
import ProjectPosterFields from '@components/account/shared/ProjectPosterFields.vue'
import { useFileProcessor } from '@composables/useFileProcessor.js'

const props = defineProps({
  project: Object,
  channel: Object,
  getMediaLink: Function
})

const emit = defineEmits(['deleteProject', 'deleteMedia', 'editMedia', 'editProject'])

const editDialog = ref(false)
const editPosterFile = ref(null)
const editPosterProcessing = ref(false)
const localPosterObjectUrl = ref(null)
const editForm = ref({
  subtitle: null,
  posterType: 'default',
  posterColor: '#000000',
  posterImage: null
})

const { handleFile: processFile } = useFileProcessor()

const hasPendingChildren = computed(() => {
  return props.project.media?.some(media => media.pending) || false
})

const editProjectPreview = computed(() => {
  return {
    title: props.project?.title || '',
    subtitle: editForm.value.subtitle || '',
    poster: editForm.value.posterType === 'new' ? editForm.value.posterImage : null,
    poster_color: editForm.value.posterColor || '#000000',
    media: Array.isArray(props.project?.media) ? props.project.media : []
  }
})

function clearLocalPosterObjectUrl() {
  if (localPosterObjectUrl.value) {
    URL.revokeObjectURL(localPosterObjectUrl.value)
    localPosterObjectUrl.value = null
  }
}

onBeforeUnmount(() => {
  clearLocalPosterObjectUrl()
})

function openEditDialog() {
  editForm.value = {
    subtitle: props.project?.subtitle ?? null,
    posterType: props.project?.poster ? 'new' : 'default',
    posterColor: props.project?.poster_color || '#000000',
    posterImage: props.project?.poster || null
  }
  editPosterFile.value = null
  editPosterProcessing.value = false
  clearLocalPosterObjectUrl()
  editDialog.value = true
}

function onUpdateSubtitle(value) {
  editForm.value = {
    ...editForm.value,
    subtitle: value
  }
}

function onUpdatePosterType(value) {
  if (value === 'default') {
    editPosterFile.value = null
    clearLocalPosterObjectUrl()
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
    posterImage: editForm.value.posterImage || props.project?.poster || null
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
  if (!file) {
    editPosterFile.value = null
    editPosterProcessing.value = false
    clearLocalPosterObjectUrl()
    editForm.value = {
      ...editForm.value,
      posterImage: props.project?.poster || null
    }
    return
  }

  editPosterFile.value = file
  const localUrl = URL.createObjectURL(file)
  clearLocalPosterObjectUrl()
  localPosterObjectUrl.value = localUrl
  editForm.value = {
    ...editForm.value,
    posterType: 'new',
    posterImage: localUrl
  }

  editPosterProcessing.value = true
  try {
    const processed = await processFile(file, 'poster')
    editPosterFile.value = processed || file
  } finally {
    editPosterProcessing.value = false
  }
}

function saveEdit() {
  emit('editProject', {
    id: props.project?.id,
    subtitle: editForm.value.subtitle,
    posterType: editForm.value.posterType,
    posterColor: editForm.value.posterColor,
    posterFile: editPosterFile.value
  })
  editDialog.value = false
}
</script>
