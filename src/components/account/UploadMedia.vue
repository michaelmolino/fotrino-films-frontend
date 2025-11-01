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
          <div class="upload-preview-container">
            <!-- Preview image/video background -->
            <div
              v-if="media.preview"
              class="upload-preview-background"
              :style="{ backgroundImage: `url(${media.preview})` }"></div>
            <!-- Progress overlay -->
            <div class="upload-progress-overlay">
              <q-circular-progress
                :indeterminate="progress === -1"
                :instant-feedback="progress < 1"
                :value="progress"
                size="80px"
                color="accent"
                track-color="transparent"
                show-value
                class="upload-progress-spinner" />
              <!-- Media title -->
              <div class="upload-media-title q-mt-md">
                {{ media.title || 'Untitled Media' }}
              </div>
              <!-- Status text -->
              <div class="upload-status-text q-mt-sm">
                {{ statusText }}
              </div>
            </div>
          </div>
        </div>
      </q-step>

      <q-step
        :name="5"
        title="Processing"
        icon="fa fa-gears"
        active-icon="fa fa-gears"
        :header-nav="step === 4 && !!next">
        <div class="text-center">
          <div class="q-mb-md">
            <MediaPreview
              :media="media"
              :project="project"
              :detail="false"
              :showMainAccent="false"
              class="processing-preview" />
          </div>
          <div class="processing-status">
            <q-icon name="fa fa-gears" size="24px" color="accent" class="q-mr-sm rotating-gears" />
            <span class="text-h6">Processing...</span>
          </div>
          <div class="q-pa-md text-body2">
            Your media <strong>{{ media.title || 'Untitled Media' }}</strong> is processing and will
            be available shortly. You'll receive an email once it's ready.
          </div>
          <div class="q-pt-md text-caption text-grey-6">You may now close this window.</div>
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <!-- Back button for steps 2 and 3 -->
          <q-btn
            v-if="step === 2 || step === 3"
            icon="fas fa-arrow-left"
            flat
            label="Back"
            @click="goBack" />

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
            @click="goNext"
            :label="step === 1 && quickUploadAvailable ? 'More Options' : 'Next'"
            :disabled="!next" />
          <q-btn
            v-if="step === 3"
            icon="fas fa-cloud-arrow-up"
            flat
            label="Upload"
            :disabled="!next"
            @click="goNext">
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
  <AuthRequired v-else type="login" message="Please log in to upload media." />
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave } from 'vue-router'
import ChannelStep from './UploadMedia/ChannelStep.vue'
import ProjectStep from './UploadMedia/ProjectStep.vue'
import MediaStep from './UploadMedia/MediaStep.vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
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
      resourceDate: new Date().toISOString().split('T')[0].replaceAll('-', '/')
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
      console.error(e)
      counter.value = 1
    }
  }
}

function goNext() {
  stepper.value.next()
}

function goBack() {
  if (step.value === 2) {
    // Going back from step 2 (Channel) to step 1 (Media)
    // Clear channel-related state
    payload.uuid = null
    payload.coverType = 'profile'
    payload.title = 'My Channel'
    coverFile.value = null
    coverThumb.value = null

    // Clear any uploaded cover files from the upload processor
    const coverIndex = uploadFiles.value.findIndex(f => f.resourceType === 'cover')
    if (coverIndex !== -1) {
      uploadFiles.value.splice(coverIndex, 1)
    }
  } else if (step.value === 3) {
    // Going back from step 3 (Project) to step 2 (Channel)
    // Clear project-related state
    payload.project.id = null
    payload.project.posterType = 'default'
    payload.project.title = 'My Videos'
    posterFile.value = null
    posterThumb.value = null

    // Clear any uploaded poster files from the upload processor
    const posterIndex = uploadFiles.value.findIndex(f => f.resourceType === 'poster')
    if (posterIndex !== -1) {
      uploadFiles.value.splice(posterIndex, 1)
    }
  }

  stepper.value.previous()
}

// computed
const profile = computed(() => store.state.account.profile)
const channels = computed(() => store.state.channel.channels)

const project = computed(() => {
  // If selecting an existing project, return it from the list
  if (payload.project.id?.value && payload.project.id.value !== 0) {
    return projects.value.find(p => p.id === payload.project.id.value)
  }

  // Creating a new project - determine poster
  const poster =
    payload.project.id?.value === 0 && payload.project.posterType === 'new'
      ? posterThumb.value
      : null

  // Return new project structure
  return {
    title: payload.project.title,
    subtitle: payload.project.subtitle,
    poster,
    media: []
  }
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
  } else if (projects.value.length === 0 && s === 3) {
    payload.project.id = { value: 0, label: 'New...' }
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
    console.error(err)
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

async function uploadSingle(u, current, total) {
  const item = uploadFiles.value.find(f => f.resourceType === u.resourceType)
  const file = item?.file
  if (!file) throw new Error(`Missing file for ${u.resourceType}`)
  statusText.value = `Uploading file ${current} of ${total}. Do not navigate away from this page!`
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
      try {
        const maybeMedia = await uploadSingle(u, counterLocal, total)
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
  globalThis.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => globalThis.removeEventListener('beforeunload', beforeUnloadHandler))

// route guard
onBeforeRouteLeave((to, from, next) => {
  if (isUploading.value) {
    const answer = globalThis.confirm(
      'You have uploads in progress. Are you sure you want to leave?'
    )
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

.upload-preview-container {
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 240px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Mobile responsive adjustments */
@media (max-width: 360px) {
  .upload-preview-container {
    width: calc(100vw - 32px);
    max-width: none;
    height: calc((100vw - 32px) * 0.75);
    margin: 0 auto;
  }
}

.upload-preview-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: brightness(0.7);
}

.upload-progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
}

.upload-progress-spinner {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  padding: 8px;
}

.upload-media-title {
  font-weight: 600;
  font-size: 1.1em;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
}

.upload-status-text {
  font-size: 0.9em;
  text-align: center;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  padding: 0 8px;
}

/* Mobile text adjustments */
@media (max-width: 360px) {
  .upload-media-title {
    font-size: 1em;
    max-width: calc(100vw - 48px);
  }

  .upload-status-text {
    font-size: 0.8em;
    line-height: 1.2;
  }
}

.processing-preview {
  max-width: 320px;
  margin: 0 auto;
}

.processing-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.rotating-gears {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
