<template>
  <div v-if="profile?.id" class="q-pa-md">
    <q-item class="q-pb-md">
      <q-item-section>
        <q-item-label class="text-h5">Upload Media</q-item-label>
      </q-item-section>
    </q-item>
    <q-stepper
      v-model="step"
      ref="stepper"
      flat
      bordered
      active-color="info"
      :inactive-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      done-color="positive"
      :vertical="$q.screen.lt.md"
      header-nav>
      <!-- Step 1: Media first -->
      <q-step
        :name="1"
        :title="step > 1 ? media.title : 'Media'"
        icon="fas fa-file-video"
        :done="step > 1"
        :header-nav="false">
        <MediaStep
          class="step"
          :payload="payload"
          :media="media"
          :mediaFile="mediaFile"
          :previewFile="previewFile"
          :handleFile="handleFile"
          :previewProcessing="isPreviewProcessing"
          @update:payload="p => Object.assign(payload, p)"
          @update:mediaFile="updateMediaFile"
          @update:previewFile="updatePreviewFile"
          @increment:counter="incrementCounter" />
      </q-step>

      <!-- Step 2: Channel -->
      <q-step
        :name="2"
        :title="step > 2 ? payload.title : 'Channel'"
        icon="fas fa-video"
        :done="step > 2"
        :header-nav="step === 1 && !!next">
        <ChannelStep
          class="step"
          :payload="payload"
          :channels="channels"
          :profile="profile"
          :coverFile="coverFile"
          :coverThumb="coverThumb"
          :handleFile="handleFile"
          @update:payload="p => Object.assign(payload, p)"
          @update:coverFile="updateCoverFile" />
      </q-step>

      <!-- Step 3: Project -->
      <q-step
        :name="3"
        :title="step > 3 ? project.title : 'Project'"
        icon="fas fa-film"
        :done="step > 3"
        :header-nav="step === 2 && !!next">
        <ProjectStep
          class="step"
          :payload="payload"
          :projects="projects"
          :project="project"
          :posterFile="posterFile"
          :handleFile="handleFile"
          @update:payload="p => Object.assign(payload, p)"
          @update:posterFile="updatePosterFile" />
      </q-step>

      <q-step
        :name="4"
        title="Upload"
        icon="fas fa-cloud-arrow-up"
        active-icon="fas fa-cloud-arrow-up"
        :done="step > 4"
        :header-nav="step === 3 && !!next">
        <div class="text-center">
          <q-circular-progress
            :indeterminate="progress === -1"
            :instant-feedback="progress < 1"
            :value="progress"
            size="50px"
            color="accent"
            class="q-ma-xl"
            show-value /><br />
          {{ statusText }}
        </div>
      </q-step>

      <q-step
        :name="5"
        title="Processing"
        icon="fa fa-gears"
        active-icon="fa fa-gears"
        :header-nav="step === 4 && !!next">
        <div class="q-pa-sm">
          Your media is processing and will be available shortly (you'll receive an email once it's
          ready). You may now close this window.
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            v-if="step === 1 && quickUploadAvailable"
            icon="fas fa-bolt"
            flat
            label="Quick Upload"
            @click="quickUpload"
            :disabled="!next" />
          <q-btn
            v-if="step < 3"
            icon="fas fa-arrow-right"
            flat
            @click="$refs.stepper.next()"
            label="Next"
            :disabled="!next" />
          <q-btn
            v-if="step === 3"
            icon="fas fa-cloud-arrow-up"
            flat
            label="Upload"
            :disabled="!next"
            @click="$refs.stepper.next()">
          </q-btn>
          <q-btn v-if="step === 4" loading disabled flat label="Uploading">
            <template v-slot:loading>
              <q-spinner-hourglass />
            </template>
          </q-btn>
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
  <div v-else class="q-pa-md">
    <q-skeleton type="rect" class="q-mb-md" height="56px" />
    <q-skeleton type="rect" class="q-mb-md" height="300px" />
    <q-skeleton type="text" width="70%" />
    <q-skeleton type="text" width="50%" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave } from 'vue-router'
import ChannelStep from './UploadMedia/ChannelStep.vue'
import ProjectStep from './UploadMedia/ProjectStep.vue'
import MediaStep from './UploadMedia/MediaStep.vue'
import { Notify } from 'quasar'
import { objectApi } from 'boot/axios'
import { useFileProcessor } from '@composables/useFileProcessor.js'

// refs & reactive state
const store = useStore()
const step = ref(1)
const stepper = ref(null)
const projects = ref([])
const payload = reactive({
  uuid: null,
  coverType: 'profile',
  title: 'My Channel',
  project: {
    id: null,
    posterType: 'default',
    title: 'My Videos',
    media: {
      main: false,
      commentsEnabled: false,
      previewType: 'frame',
      resourceDate: new Date().toISOString().split('T')[0].replace(/-/g, '/')
    }
  }
})

const coverFile = ref(null)
const coverThumb = ref(null)
const posterFile = ref(null)
const posterThumb = ref(null)
const previewFile = ref(null)
const previewThumb = ref(null)
const previewThumbRandom = ref(null)
const mediaFile = ref(null)
const counter = ref(0)
const isUploading = ref(false)
const progress = ref(0)
const statusText = ref(null)
const extractingFrame = ref(false)

const { uploadFiles, handleFile: processFile, getRandomFrameFromFile } = useFileProcessor()

const isPreviewProcessing = computed(() => {
  const preview = uploadFiles.value.find(r => r.resourceType === 'preview')
  return extractingFrame.value || (preview && preview.processing === true)
})

// Keep a template-friendly handleFile function name (wrapper)
async function handleFile(fileOrFiles, resourceType) {
  // normalize Quasar QFile which may pass an array
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  if (!file) {
    // clear relevant ref
    if (resourceType === 'cover') coverFile.value = null
    if (resourceType === 'poster') posterFile.value = null
    if (resourceType === 'preview') previewFile.value = null
    if (resourceType === 'upload') mediaFile.value = null
    return
  }

  // set the correct local ref so watchers and template stay in sync
  if (resourceType === 'cover') coverFile.value = file
  if (resourceType === 'poster') posterFile.value = file
  if (resourceType === 'preview') previewFile.value = file
  if (resourceType === 'upload') mediaFile.value = file

  // start processing in background so thumbnail appears immediately
  processFile(file, resourceType).catch(err => {
    // processFile already notifies on error, but keep console log here
    console.error('Background file processing error:', err)
  })
}

// named update helpers used by child components to avoid inline closures that may
// try to set .value on a null/undefined ref (seen in runtime error).
function updateCoverFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  try {
    coverFile.value = file
    if (file && processFile) processFile(file, 'cover').catch(err => console.error(err))
  } catch (err) {
    console.error('Failed to update coverFile ref:', err)
    Notify.create({ type: 'negative', message: 'Internal error updating cover file.' })
  }
}

function updatePosterFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  try {
    posterFile.value = file
    if (file && processFile) processFile(file, 'poster').catch(err => console.error(err))
  } catch (err) {
    console.error('Failed to update posterFile ref:', err)
    Notify.create({ type: 'negative', message: 'Internal error updating poster file.' })
  }
}

function updateMediaFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  try {
    mediaFile.value = file
    if (file && processFile) processFile(file, 'upload').catch(err => console.error(err))
  } catch (err) {
    console.error('Failed to update mediaFile ref:', err)
    Notify.create({ type: 'negative', message: 'Internal error updating media file.' })
  }
}

function updatePreviewFile(fileOrFiles) {
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  try {
    previewFile.value = file
    if (file && processFile) processFile(file, 'preview').catch(err => console.error(err))
  } catch (err) {
    console.error('Failed to update previewFile ref:', err)
    Notify.create({ type: 'negative', message: 'Internal error updating preview file.' })
  }
}

function incrementCounter() {
  try {
    if (typeof counter.value !== 'number') counter.value = 0
    counter.value = (counter.value || 0) + 1
  } catch (err) {
    console.error('Failed to increment counter:', err)
    // try a safe fallback
    try {
      counter.value = Number(counter.value) + 1
    } catch (e) {
      counter.value = 1
    }
  }
}

// computed
const profile = computed(() => store.state.account.profile)
const channels = computed(() => store.state.channel.channels)

const project = computed(() => {
  if (
    !payload.project.id ||
    (payload.project.id.value === 0 && payload.project.posterType === 'new' && !posterFile.value)
  ) {
    return {
      title: payload.project.title,
      subtitle: payload.project.subtitle,
      poster: null,
      media: []
    }
  } else if (payload.project.id && payload.project.id.value !== 0) {
    return projects.value.find(p => p.id === payload.project.id.value)
  } else if (
    payload.project.id &&
    payload.project.id.value === 0 &&
    payload.project.posterType === 'default'
  ) {
    return {
      title: payload.project.title,
      subtitle: payload.project.subtitle,
      poster: null,
      media: []
    }
  } else if (
    payload.project.id &&
    payload.project.id.value === 0 &&
    payload.project.posterType === 'new'
  ) {
    return {
      title: payload.project.title,
      subtitle: payload.project.subtitle,
      poster: posterThumb.value,
      media: []
    }
  }
  return {}
})

const media = computed(() => {
  if (mediaFile.value && payload.project.media.previewType === 'frame') {
    return {
      title: payload.project.media.title,
      description: payload.project.media.description,
      main: payload.project.media.main,
      preview: previewThumbRandom.value
    }
  } else if (previewFile.value && payload.project.media.previewType === 'new') {
    return {
      title: payload.project.media.title,
      description: payload.project.media.description,
      main: payload.project.media.main,
      preview: previewThumb.value
    }
  }
  return {
    title: payload.project.media.title,
    description: payload.project.media.description,
    main: payload.project.media.main
  }
})

const next = computed(() => {
  switch (step.value) {
    case 1: // Media
      return (
        !!payload.project?.media?.title &&
        !!mediaFile.value &&
        ((payload.project.media.previewType === 'new' && !!previewFile.value) ||
          (payload.project.media.previewType === 'frame' && !!previewThumbRandom.value))
      )
    case 2: // Channel
      return (
        payload.uuid !== null &&
        (!!payload.uuid?.value ||
          (!!payload.title && (!!coverFile.value || payload.coverType === 'profile')))
      )
    case 3: // Project
      return (
        payload.project.id !== null &&
        (!!payload.project.id?.value ||
          (!!payload.project.title &&
            (!!posterFile.value || payload.project.posterType === 'default')))
      )
    default:
      return false
  }
})

const quickUploadAvailable = computed(() => {
  const ch = channels.value || []
  if (ch.length === 0) return true
  if (ch.length === 1) {
    const p = projects.value || []
    return p.length <= 1
  }
  return false
})

async function quickUpload() {
  try {
    // Ensure media step is valid (we only show button when on step 1)
    if (!next.value) return
    // Resolve channel selection: use the single existing or set to New (0)
    const ch = channels.value || []
    if (ch.length === 1) {
      payload.uuid = { value: ch[0].uuid, label: ch[0].title }
    } else if (ch.length === 0) {
      payload.uuid = { value: 0, label: 'New...' }
    }
    // Resolve projects if channel exists
    projects.value = []
    if (payload.uuid && payload.uuid.value && payload.uuid.value !== 0) {
      const chan = await store.cache.dispatch('channel/getChannel', {
        uuid: payload.uuid.value,
        pending: true
      })
      projects.value = chan.projects || []
    }
    // Select or create project
    if (projects.value.length === 1) {
      const p = projects.value[0]
      payload.project.id = { value: p.id, label: p.title }
    } else {
      payload.project.id = { value: 0, label: 'New...' }
    }
    // Jump directly to Upload step (4)
    step.value = 4
  } catch (err) {
    console.error('Quick upload setup failed:', err)
    Notify.create({ type: 'negative', message: 'Quick upload failed to initialize.' })
  }
}

// watchers
// Keep projects in sync with the selected channel. If 'New...' is selected, there are no projects.
watch(
  () => payload.uuid?.value,
  async newUuid => {
    try {
      if (!newUuid || newUuid === 0) {
        projects.value = []
        // Ensure the Project step defaults to creating a new project
        if (!payload.project?.id || payload.project.id.value !== 0) {
          payload.project.id = { value: 0, label: 'New...' }
        }
        return
      }

      await loadProjectsForChannelUuid(newUuid)
      // If the previously selected project isn't part of this channel, reset selection
      const currentId = payload.project?.id?.value
      const found = currentId && projects.value.some(p => p.id === currentId)
      if (!found) {
        if (projects.value.length === 1) {
          const p = projects.value[0]
          payload.project.id = { value: p.id, label: p.title }
        } else {
          payload.project.id = { value: 0, label: 'New...' }
        }
      }
    } catch (err) {
      console.error('Failed syncing projects with channel selection:', err)
      projects.value = []
      payload.project.id = { value: 0, label: 'New...' }
    }
  }
)

watch(channels, ch => {
  if (ch.length === 0 && step.value === 2) payload.uuid = { value: 0, label: 'New...' }
  if (ch.length === 1 && step.value === 2) {
    payload.uuid = ch.map(({ uuid, title }) => ({ value: uuid, label: title }))[0]
  }
  // Keep projects in sync for quick upload checks
  if (ch.length === 1) {
    loadProjectsForChannelUuid(ch[0].uuid)
  } else {
    projects.value = []
  }
})

watch(projects, p => {
  if (p.length === 0 && step.value === 3) payload.project.id = { value: 0, label: 'New...' }
  if (p.length === 1 && step.value === 3) {
    payload.project.id = p.map(({ id, title }) => ({ value: id, label: title }))[0]
  }
})

watch(step, s => {
  if (s === 3 && payload.uuid?.value !== 0 && payload.uuid?.value) {
    store.cache
      .dispatch('channel/getChannel', { uuid: payload.uuid.value, pending: true })
      .then(ch => {
        projects.value = ch.projects
        if (projects.value.length === 0) payload.project.id = { value: 0, label: 'New...' }
        if (projects.value.length === 1) {
          payload.project.id = projects.value.map(({ id, title }) => ({
            value: id,
            label: title
          }))[0]
        }
      })
  } else {
    if (projects.value.length === 0 && s === 3) payload.project.id = { value: 0, label: 'New...' }
  }
  if (s === 4) factoryUpload()
})

// thumbnail previews for selected files
watch(coverFile, file => {
  if (file) {
    const reader = new FileReader()
    reader.onload = e => {
      coverThumb.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else coverThumb.value = null
})

watch(posterFile, file => {
  if (file) {
    const reader = new FileReader()
    reader.onload = e => {
      posterThumb.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else posterThumb.value = null
})

watch(previewFile, file => {
  if (file) {
    const reader = new FileReader()
    reader.onload = e => {
      previewThumb.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else previewThumb.value = null
})

watch(mediaFile, file => {
  if (file) payload.project.media.filename = file.name
  else payload.project.media.filename = null
})

// when mediaFile + previewType='frame' changes, extract a random frame and add as preview
// Only trigger extraction when mediaFile or the refresh counter changes.
watch([() => mediaFile.value, () => counter.value], async ([mf]) => {
  if (payload.project.media.previewType !== 'frame' || !mf) return
  try {
    extractingFrame.value = true
    const result = await getRandomFrameFromFile(mf)
    previewThumbRandom.value = result?.url || null
    if (result?.blob) {
      const file = new File([result.blob], 'frame.jpg', { type: 'image/jpeg' })
      await processFile(file, 'preview')
    }
  } catch (err) {
    payload.project.media.previewType = 'new'
    Notify.create({
      type: 'negative',
      timeout: 0,
      message: 'Error extracting frames from video.',
      icon: 'fas fa-triangle-exclamation'
    })
  } finally {
    extractingFrame.value = false
  }
})

// composable provides uploadFiles and helpers
// processFile(file, resourceType) stores processed image or upload file into uploadFiles

// helpers for upload flow
function onUploadProgress(progressEvent) {
  progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
}

async function uploadSingle(u) {
  const item = uploadFiles.value.find(f => f.resourceType === u.resourceType)
  const file = item?.file
  if (!file) throw new Error(`Missing file for ${u.resourceType}`)
  statusText.value = `Uploading file (${u.resourceType}). Do not navigate away from this page!`
  await objectApi.put(u.url, file, { headers: { 'Content-Type': file.type }, onUploadProgress })
  return u.resourceType === 'upload' ? u.reference : null
}

async function factoryUpload() {
  isUploading.value = true
  try {
    const upload = await store.dispatch('channel/postUpload', payload)
    let counterLocal = 1
    const total = upload.length
    let mediaRef = null
    for (const u of upload) {
      progress.value = 0
      statusText.value = `Uploading file (${u.resourceType}) ${counterLocal} of ${total}. Do not navigate away from this page!`
      try {
        const maybeMedia = await uploadSingle(u)
        if (maybeMedia) mediaRef = maybeMedia
      } catch (err) {
        progress.value = -1
        statusText.value = 'Something went wrong!'
        console.error('Error uploading:', err)
        isUploading.value = false
        throw err
      }
      counterLocal++
    }

    await store.dispatch('channel/confirmUpload', mediaRef)
    stepper.value?.next()
    isUploading.value = false
  } catch (err) {
    isUploading.value = false
    progress.value = -1
    statusText.value = 'Something went wrong!'
    throw err
  }
}

// Step-specific helpers live in the step components now

// lifecycle
async function loadProjectsForChannelUuid(uuid) {
  try {
    const chan = await store.cache.dispatch('channel/getChannel', { uuid, pending: true })
    projects.value = chan?.projects || []
  } catch (err) {
    console.error('Failed to load channel projects:', err)
    projects.value = []
  }
}

const beforeUnloadHandler = event => {
  if (isUploading.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(async () => {
  await store.dispatch('channel/getChannels')
  const list = store.state.channel.channels || []
  if (list.length === 1) {
    await loadProjectsForChannelUuid(list[0].uuid)
  } else {
    projects.value = []
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

// route guard
onBeforeRouteLeave((to, from, next) => {
  if (isUploading.value) {
    const answer = window.confirm('You have uploads in progress. Are you sure you want to leave?')
    if (!answer) {
      next(false)
      return
    }
  }
  next()
})
</script>

<style scoped>
.step {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}
</style>
