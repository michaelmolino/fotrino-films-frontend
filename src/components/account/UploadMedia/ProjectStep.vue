<template>
  <div>
    <q-select
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      label="Project *"
      :model-value="payload.project.id"
      @update:model-value="onUpdateProjectId"
      :options="filteredOptions"
      data-cy="upload-project-select"
      class="q-pb-md" />
    <q-input
      v-if="payload.project.id?.value === 0"
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      class="q-pb-md"
      clearable
      :model-value="payload.project.title"
      label="Project Title *"
      data-cy="upload-project-title"
      @update:model-value="onUpdateProjectTitle"
      @focus="clearDefaultProjectTitle"
      @blur="restoreDefaultProjectTitle" />
    <q-card v-if="payload.project.id?.value !== 0" flat bordered class="q-pb-md">
      <q-card-section>
        <div class="text-overline">Project Poster</div>
        <div class="width250" data-cy="upload-project-poster-preview-existing">
          <ProjectPoster v-if="displayProject" :project="displayProject" />
          <q-skeleton
            v-else
            class="cursor-not-allowed"
            style="width: 250px; height: 375px"
            animation="none" />
        </div>
      </q-card-section>
    </q-card>
    <q-card v-if="payload.project.id?.value === 0" flat bordered class="q-pb-md">
      <q-card-section>
        <ProjectPosterFields
          :subtitle="payload.project.subtitle"
          :input-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
          :show-subtitle="true"
          :show-poster-type="true"
          :poster-type="localPosterType"
          :poster-color="payload.project.posterColor || defaultColor"
          :poster-file="posterFile"
          :project-preview="displayProject"
          subtitle-data-cy="upload-project-subtitle"
          poster-type-default-data-cy="upload-project-poster-type-default"
          poster-type-new-data-cy="upload-project-poster-type-new"
          poster-file-data-cy="upload-project-poster-file"
          poster-color-button-data-cy="upload-project-poster-color"
          poster-preview-data-cy="upload-project-poster-preview"
          @update:subtitle="onUpdateProjectSubtitle"
          @update:posterType="onUpdatePosterType"
          @update:posterColor="onUpdatePosterColor"
          @update:posterFile="onUpdatePosterFile" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import ProjectPoster from '@components/channel/ProjectPoster.vue'
import ProjectPosterFields from '@components/account/shared/ProjectPosterFields.vue'
const props = defineProps({
  payload: Object,
  projects: Array,
  project: Object,
  posterFile: [File, Array, null],
  handleFile: Function
})
const emit = defineEmits(['update:payload', 'update:posterFile'])
const defaultColor = '#000000'

// Filter projects that are eligible for the currently selected channel.
// Parent now syncs projects per-channel, but keep this defensive.
const filteredOptions = computed(() => {
  const list = Array.isArray(props.projects) ? props.projects : []
  return list
    .map(({ id, title }) => ({ value: id, label: title }))
    .concat({ value: 0, label: 'New...' })
})

const localPosterType = computed(() => props.payload.project.posterType)

// Use payload.project for preview when creating a new project (id === 0),
// otherwise use the existing project prop. This ensures posterColor updates
// are reflected in the live preview.
const displayProject = computed(() => {
  const currentId = props.payload?.project?.id

  // If id is undefined (no selection made), return null to show skeleton
  if (currentId === undefined) {
    return null
  }

  const isNew = currentId?.value === 0
  const base = isNew ? props.payload.project || {} : props.project || {}
  const parentProject = props.project || {}

  // For new projects, posterColor should come from payload
  // For existing projects, posterColor should come from the project data
  const posterColor = isNew
    ? props.payload?.project?.posterColor || defaultColor
    : parentProject.posterColor || defaultColor

  return {
    // Prefer parent-computed media array (reflects current poster/media counts)
    media: Array.isArray(parentProject.media) ? parentProject.media : [],
    // Prefer parent-computed poster (e.g., posterThumb for uploads), else none
    poster: parentProject.poster || null,
    // Live title/subtitle from payload when creating new, fallback to parent when needed
    title: base.title || parentProject.title || '',
    subtitle: base.subtitle || parentProject.subtitle || '',
    // Use the appropriate poster color based on whether it's a new or existing project
    posterColor: posterColor
  }
})

function onUpdateProjectId(val) {
  emit('update:payload', { ...props.payload, project: { ...props.payload.project, id: val } })
}
function onUpdateProjectTitle(val) {
  emit('update:payload', { ...props.payload, project: { ...props.payload.project, title: val } })
}
function onUpdateProjectSubtitle(val) {
  emit('update:payload', {
    ...props.payload,
    project: { ...props.payload.project, subtitle: val }
  })
}
function onUpdatePosterType(val) {
  emit('update:payload', {
    ...props.payload,
    project: { ...props.payload.project, posterType: val }
  })
  if (val !== 'new') {
    emitUpdatePosterNull()
  }
}
function onUpdatePosterColor(val) {
  emit('update:payload', {
    ...props.payload,
    project: { ...props.payload.project, posterColor: val }
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
function clearDefaultProjectTitle() {
  emit('update:payload', { ...props.payload, project: { ...props.payload.project, title: '' } })
}
function restoreDefaultProjectTitle() {
  if (props.payload.project.title === '') {
    emit('update:payload', {
      ...props.payload,
      project: { ...props.payload.project, title: 'My Videos' }
    })
  }
}

// Default selection behavior based on available projects:
// - 0 projects: default to New... (value 0)
// - 1 project: default to that project
// - >1 projects: leave blank to force explicit selection
function ensureDefaultProjectSelection() {
  const list = Array.isArray(props.projects) ? props.projects : []
  const current = props.payload?.project?.id

  if (list.length === 0) {
    // No projects available, default to New...
    if (!current || current.value !== 0) {
      emit('update:payload', {
        ...props.payload,
        project: { ...props.payload.project, id: { value: 0, label: 'New...' } }
      })
    }
  } else if (list.length === 1) {
    // Only one project, auto-select it
    const { id, title } = list[0]
    if (!current || current.value !== id) {
      emit('update:payload', {
        ...props.payload,
        project: { ...props.payload.project, id: { value: id, label: title } }
      })
    }
  } else {
    // Multiple projects, force blank selection unless user has made a valid choice
    const hasValidSelection = current && list.some(p => p.id === current.value)
    if (!hasValidSelection && (!current || current.value === 0)) {
      emit('update:payload', {
        ...props.payload,
        project: { ...props.payload.project, id: undefined }
      })
    }
  }
}

onMounted(() => ensureDefaultProjectSelection())
watch(
  () => (props.projects || []).length,
  () => ensureDefaultProjectSelection()
)
</script>
