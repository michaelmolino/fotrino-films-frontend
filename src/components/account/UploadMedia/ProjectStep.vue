<template>
  <div>
    <q-select
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      label="Project *"
      :model-value="payload.project.id"
      @update:model-value="onUpdateProjectId"
      :options="filteredOptions"
      class="q-pb-md" />
    <q-input
      v-if="payload.project.id?.value === 0"
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      class="q-pb-md"
      clearable
      :model-value="payload.project.title"
      label="Project Title *"
      @update:model-value="onUpdateProjectTitle"
      @focus="clearDefaultProjectTitle"
      @blur="restoreDefaultProjectTitle" />
    <q-input
      v-if="payload.project.id?.value === 0"
      outlined
      :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      class="q-pb-md"
      clearable
      :model-value="payload.project.subtitle"
      label="Project SubTitle"
      @update:model-value="onUpdateProjectSubtitle" />
    <q-card flat bordered class="q-pb-md">
      <q-card-section>
        <div class="text-overline q-mb-md">Project Poster</div>
        <div class="row items-center q-gutter-sm">
          <q-radio
            v-if="payload.project.id?.value === 0"
            v-model="localPosterType"
            val="default"
            label="Solid Colour"
            color="accent" />
          <q-btn
            v-if="payload.project.id?.value === 0 && localPosterType === 'default'"
            flat
            dense
            no-caps
            padding="0px"
            color="accent"
            label="Change Colour"
            @click="colorDialog = true" />
        </div>
        <q-radio
          v-if="payload.project.id?.value === 0"
          v-model="localPosterType"
          val="new"
          label="Upload Photo"
          color="accent" />
        <q-file
          v-if="payload.project.id?.value === 0 && localPosterType === 'new'"
          label="Profile Poster (Image)"
          outlined
          :model-value="posterFile"
          accept="image/*"
          class="q-py-md"
          color="accent"
          @update:model-value="onUpdatePosterFile">
          <template v-slot:prepend>
            <q-icon name="image" @click.stop.prevent />
          </template>
          <template v-slot:append>
            <q-icon
              name="close"
              @click.stop.prevent="emitUpdatePosterNull"
              class="cursor-pointer" />
          </template>
        </q-file>
        <div class="width250">
          <ProjectPoster v-if="displayProject" :project="displayProject" />
          <q-skeleton
            v-else
            class="cursor-not-allowed"
            style="width: 250px; height: 375px"
            animation="none" />
        </div>
      </q-card-section>
    </q-card>
    <q-dialog v-model="colorDialog">
      <q-card style="min-width: 300px">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle1">Choose Poster Colour</div>
        </q-card-section>
        <q-card-section>
          <q-color
            class="q-mt-sm"
            :model-value="payload.project.poster_color || defaultColor"
            @update:model-value="onUpdatePosterColor"
            format="hex"
            default-view="palette" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="colorDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ProjectPoster from '@components/channel/ProjectPoster.vue'
const props = defineProps({
  payload: Object,
  projects: Array,
  project: Object,
  posterFile: [File, Array, null],
  handleFile: Function
})
const emit = defineEmits(['update:payload', 'update:posterFile'])
const defaultColor = '#000000'
const colorDialog = ref(false)

// Filter projects that are eligible for the currently selected channel.
// Parent now syncs projects per-channel, but keep this defensive.
const filteredOptions = computed(() => {
  const list = Array.isArray(props.projects) ? props.projects : []
  return list
    .map(({ id, title }) => ({ value: id, label: title }))
    .concat({ value: 0, label: 'New...' })
})

const localPosterType = computed({
  get: () => props.payload.project.posterType,
  set: v =>
    emit('update:payload', {
      ...props.payload,
      project: { ...props.payload.project, posterType: v }
    })
})

// Use payload.project for preview when creating a new project (id === 0),
// otherwise use the existing project prop. This ensures poster_color updates
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

  // For new projects, poster_color should come from payload
  // For existing projects, poster_color should come from the project data
  const posterColor = isNew
    ? (props.payload?.project?.poster_color || defaultColor)
    : (parentProject.poster_color || defaultColor)

  return {
    // Prefer parent-computed media array (reflects current poster/media counts)
    media: Array.isArray(parentProject.media) ? parentProject.media : [],
    // Prefer parent-computed poster (e.g., posterThumb for uploads), else none
    poster: parentProject.poster || null,
    // Live title/subtitle from payload when creating new, fallback to parent when needed
    title: base.title || parentProject.title || '',
    subtitle: base.subtitle || parentProject.subtitle || '',
    // Use the appropriate poster color based on whether it's a new or existing project
    poster_color: posterColor
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
function onUpdatePosterColor(val) {
  // Normalize color to CSS-friendly hex with leading '#'
  let color = defaultColor
  if (typeof val === 'string') {
    color = val.startsWith('#') ? val : `#${val}`
  } else if (val && typeof val === 'object') {
    // Quasar may emit an object depending on format; prefer hex
    const hex = val.hex || ''
    color = hex ? (hex.startsWith('#') ? hex : `#${hex}`) : defaultColor
  }
  emit('update:payload', {
    ...props.payload,
    project: { ...props.payload.project, poster_color: color }
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
