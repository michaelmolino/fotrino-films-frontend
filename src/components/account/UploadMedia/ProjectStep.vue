<template>
  <div>
    <div class="row">
      <div class="col-xs-12 col-md-6 q-pa-sm">
        <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Project *"
          :model-value="payload.project.id"
          @update:model-value="onUpdateProjectId"
          :options="projects.map(({ id, title }) => ({ value: id, label: title })).concat({ value: 0, label: 'New...' })"
          class="q-pb-md"
        />
        <div class="width250x">
          <ProjectPoster :project="project" />
        </div>
      </div>
      <div class="col-xs-12 col-md-6 q-pa-sm">
        <span v-if="payload.project.id?.value === 0">
          <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md" clearable
            :model-value="payload.project.title" label="Project Title *"
            @update:model-value="onUpdateProjectTitle"
            @focus="clearDefaultProjectTitle" @blur="restoreDefaultProjectTitle"
          />
          <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md" clearable
            :model-value="payload.project.subtitle" label="Project SubTitle"
            @update:model-value="onUpdateProjectSubtitle"
          />
          <q-radio v-model="localPosterType" val="default" label="Default" color="accent" /><br />
          <q-radio v-model="localPosterType" val="new" label="Upload Photo" color="accent" />
          <q-file v-if="localPosterType === 'new'" label="Profile Poster (Image)" outlined :model-value="posterFile" accept="image/*" class="q-py-md" color="accent" @update:model-value="onUpdatePosterFile">
            <template v-slot:prepend>
              <q-icon name="image" @click.stop.prevent />
            </template>
            <template v-slot:append>
              <q-icon name="close" @click.stop.prevent="emitUpdatePosterNull" class="cursor-pointer" />
            </template>
          </q-file>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProjectPoster from '@components/channel/ProjectPoster.vue'
const props = defineProps({ payload: Object, projects: Array, project: Object, posterFile: [File, Array, null], handleFile: Function })
const emit = defineEmits(['update:payload', 'update:posterFile'])

const localPosterType = computed({ get: () => props.payload.project.posterType, set: (v) => emit('update:payload', { ...props.payload, project: { ...props.payload.project, posterType: v } }) })

function onUpdateProjectId(val) { emit('update:payload', { ...props.payload, project: { ...props.payload.project, id: val } }) }
function onUpdateProjectTitle(val) { emit('update:payload', { ...props.payload, project: { ...props.payload.project, title: val } }) }
function onUpdateProjectSubtitle(val) { emit('update:payload', { ...props.payload, project: { ...props.payload.project, subtitle: val } }) }
function onUpdatePosterFile(fileOrFiles) { const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles; emit('update:posterFile', file); if (file && props.handleFile) props.handleFile(file, 'poster') }
function emitUpdatePosterNull() { emit('update:posterFile', null) }
function clearDefaultProjectTitle() { emit('update:payload', { ...props.payload, project: { ...props.payload.project, title: '' } }) }
function restoreDefaultProjectTitle() { if (props.payload.project.title === '') emit('update:payload', { ...props.payload, project: { ...props.payload.project, title: 'My Videos' } }) }
</script>
