<template>
  <div v-if="profile?.id" class="q-pa-md" data-cy="upload-page">
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
      data-cy="upload-stepper"
      active-color="info"
      :inactive-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
      done-color="positive"
      :vertical="$q.screen.lt.md"
      header-nav>
      <!-- Step 1: Media first -->
      <q-step
        :name="1"
        :title="stepTitles.media"
        icon="movie"
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
          @update:mediaFile="file => handleFile(file, 'upload')"
          @update:previewFile="file => handleFile(file, 'preview')"
          @increment:counter="incrementCounter" />
      </q-step>

      <!-- Step 2: Channel -->
      <q-step
        :name="2"
        :title="stepTitles.channel"
        icon="video_library"
        :done="step > 2"
        :header-nav="canOpenStepFromHeader(2)">
        <ChannelStep
          class="step"
          :payload="payload"
          :channels="channels"
          :profile="profile"
          :coverFile="coverFile"
          :coverThumb="coverThumb"
          :handleFile="handleFile"
          @update:payload="p => Object.assign(payload, p)"
          @update:coverFile="file => handleFile(file, 'cover')" />
      </q-step>

      <!-- Step 3: Project -->
      <q-step
        :name="3"
        :title="stepTitles.project"
        icon="theaters"
        :done="step > 3"
        :header-nav="canOpenStepFromHeader(3)">
        <ProjectStep
          class="step"
          :payload="payload"
          :projects="projects"
          :project="project"
          :posterFile="posterFile"
          :handleFile="handleFile"
          @update:payload="p => Object.assign(payload, p)"
          @update:posterFile="file => handleFile(file, 'poster')" />
      </q-step>

      <q-step
        :name="4"
        title="Upload"
        icon="cloud_upload"
        active-icon="cloud_upload"
        data-cy="upload-step-upload"
        :done="step > 4"
        :header-nav="canOpenStepFromHeader(4)">
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
                {{ media.title }}
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
        icon="settings"
        active-icon="settings"
        data-cy="upload-step-processing"
        :header-nav="false">
        <div class="text-center">
          <div class="q-mb-md">
            <MediaPreview
              :media="media"
              :project="project"
              :detail="false"
              :showMainAccent="false"
              class="processing-preview" />
          </div>
          <div class="processing-status" data-cy="upload-processing-status">
            <q-icon name="settings" size="24px" color="accent" class="q-mr-sm rotating-gears" />
            <span class="text-h6" data-cy="upload-processing-text">Processing...</span>
          </div>
          <div class="q-pa-md text-body2">
            Your media <strong>{{ media.title }}</strong> is processing and will
            be available shortly. You'll receive an email once it's ready.
          </div>
          <div class="q-pt-md text-caption text-grey-6">You may now close this window.</div>
        </div>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <!-- Back button for steps 2 and 3 -->
          <q-btn
            v-if="canGoBack"
            icon="arrow_back"
            flat
            label="Back"
            @click="goBack" />

          <q-btn
            v-if="showQuickUploadButton"
            icon="bolt"
            flat
            label="Quick Upload"
            data-cy="upload-quick-button"
            @click="quickUpload"
            :disabled="!next" />
          <q-btn
            v-if="showNextButton"
            icon="arrow_forward"
            flat
            data-cy="upload-next-button"
            @click="goNext"
            :label="nextButtonLabel"
            :disabled="!next" />
          <q-btn
            v-if="showUploadButton"
            icon="cloud_upload"
            flat
            label="Upload"
            data-cy="upload-submit-button"
            :disabled="!next"
            @click="goNext">
          </q-btn>
          <q-btn v-if="showUploadingButton" loading disabled flat label="Uploading">
            <template v-slot:loading>
              <q-spinner-hourglass />
            </template>
          </q-btn>
          <q-btn
            v-if="showCancelUploadButton"
            flat
            icon="cancel"
            label="Cancel"
            color="negative"
            @click="cancelUpload" />
          <q-btn
            v-if="showRetryUploadButton"
            icon="refresh"
            flat
            label="Retry Upload"
            @click="startUploadJourney" />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
  <AuthRequired v-else type="login" message="Please log in to upload media." />
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave } from 'vue-router'
import ChannelStep from './UploadMedia/ChannelStep.vue'
import ProjectStep from './UploadMedia/ProjectStep.vue'
import MediaStep from './UploadMedia/MediaStep.vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { Notify } from 'quasar'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'
import { useFileProcessor } from '@composables/useFileProcessor.js'
import { useUploadFlow } from '@composables/useUploadFlow.js'

// refs & reactive state
const store = useStore()
const step = ref(1)
const stepper = ref(null)
const projects = ref([])
/** @type {import('src/types/api-contract').UploadMediaRequest} */
const initialPayload = {
  uuid: null,
  coverType: 'profile',
  title: 'My Channel',
  project: {
    id: null,
    posterType: 'default',
    title: 'My Videos',
    media: {
      main: false,
      previewType: 'frame',
      resourceDate: new Date().toISOString().split('T')[0]
    }
  }
}
const payload = reactive({
  ...initialPayload
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
const projectsLoadToken = ref(0)
const extractingFrame = ref(false)
const frameExtractionToken = ref(0)
const uploadTriggered = ref(false)
let dismissUploadErrorNotify = null

const {
  uploadFiles,
  handleFile: processFile,
  getRandomFrameFromFile,
  disposeFrameSession
} = useFileProcessor()
const { factoryUpload, cancel: cancelUpload, progress, statusText, isUploading } = useUploadFlow({
  store,
  payload,
  stepper,
  uploadFiles
})

const isPreviewProcessing = computed(() => {
  const preview = uploadFiles.value.find(r => r.resourceType === 'preview')
  return extractingFrame.value || (preview && preview.processing === true)
})

const stepTitles = computed(() => ({
  media: step.value > 1 ? media.value.title : 'Media',
  channel: step.value > 2 ? payload.title : 'Channel',
  project: step.value > 3 ? project.value.title : 'Project'
}))

const canGoBack = computed(() => step.value === 2 || step.value === 3)
const showQuickUploadButton = computed(() => step.value === 1 && quickUploadAvailable.value)
const showNextButton = computed(() => step.value < 3)
const showUploadButton = computed(() => step.value === 3)
const showUploadingButton = computed(() => step.value === 4 && isUploading.value)
const showCancelUploadButton = computed(() => step.value === 4 && isUploading.value)
const showRetryUploadButton = computed(() => step.value === 4 && !isUploading.value)
const nextButtonLabel = computed(() =>
  step.value === 1 && quickUploadAvailable.value ? 'More Options' : 'Next'
)

function canOpenStepFromHeader(targetStep) {
  return step.value === targetStep - 1 && !!next.value
}

function clearUploadErrorNotify() {
  if (typeof dismissUploadErrorNotify === 'function') {
    dismissUploadErrorNotify()
    dismissUploadErrorNotify = null
  }
}

function setSelectedFile(resourceType, file) {
  if (resourceType === 'cover') coverFile.value = file
  if (resourceType === 'poster') posterFile.value = file
  if (resourceType === 'preview') previewFile.value = file
  if (resourceType === 'upload') mediaFile.value = file
}

function clearUploadFile(resourceType) {
  const uploadFileIndex = uploadFiles.value.findIndex(file => file.resourceType === resourceType)
  if (uploadFileIndex !== -1) {
    uploadFiles.value.splice(uploadFileIndex, 1)
  }
}

// Keep a template-friendly handleFile function name (wrapper)
async function handleFile(fileOrFiles, resourceType) {
  // normalize Quasar QFile which may pass an array
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  if (!file) {
    setSelectedFile(resourceType, null)
    return
  }

  // set the correct local ref so watchers and template stay in sync
  setSelectedFile(resourceType, file)

  // start processing in background so thumbnail appears immediately
  processFile(file, resourceType).catch(err => {
    // processFile already notifies on error, but keep console log here
    console.error('Background file processing error:', err)
  })
}

function incrementCounter() {
  counter.value += 1
}

function setPreviewThumbRandom(url) {
  if (previewThumbRandom.value && previewThumbRandom.value !== url) {
    URL.revokeObjectURL(previewThumbRandom.value)
  }
  previewThumbRandom.value = url
}

function scheduleUploadStart() {
  // Wait one macrotask so the upload step is rendered before the flow mutates UI state.
  setTimeout(() => {
    startUploadJourney()
  }, 0)
}

function goNext() {
  stepper.value.next()
}

async function startUploadJourney() {
  if (isUploading.value || uploadTriggered.value) {
    return
  }

  clearUploadErrorNotify()
  uploadTriggered.value = true
  await nextTick()

  try {
    await factoryUpload()
    if (step.value === 4) {
      throw new Error('Upload did not start. Please try again.')
    }

    clearUploadErrorNotify()
  } catch (err) {
    statusText.value = getComponentApiErrorMessage(err, 'Something went wrong!')
    clearUploadErrorNotify()
    dismissUploadErrorNotify = Notify.create({
      type: 'negative',
      timeout: 0,
      message: statusText.value,
      icon: 'warning',
      actions: [{ label: 'Dismiss', color: 'white' }]
    })
  } finally {
    uploadTriggered.value = false
  }
}

function goBack() {
  if (step.value === 2) {
    resetChannelStep()
  } else if (step.value === 3) {
    resetProjectStep()
  }

  stepper.value.previous()
}

function resetChannelStep() {
  payload.uuid = null
  payload.coverType = 'profile'
  payload.title = 'My Channel'
  coverFile.value = null
  coverThumb.value = null
  clearUploadFile('cover')
}

function resetProjectStep() {
  payload.project.id = null
  payload.project.posterType = 'default'
  payload.project.title = 'My Videos'
  posterFile.value = null
  posterThumb.value = null
  clearUploadFile('poster')
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
        !isPreviewProcessing.value &&
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

    // Quick upload skips the intermediate UI steps; explicitly enter
    // the Upload step so tests and users can observe upload progress.
    step.value = 4
    scheduleUploadStart()
  } catch (err) {
    console.error('Quick upload setup failed:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Quick upload failed to initialize.')
    })
  }
}

// watchers
// Keep projects in sync with the selected channel. If 'New...' is selected, there are no projects.
watch(
  () => payload.uuid?.value,
  async newUuid => {
    try {
      if (!newUuid || newUuid === 0) {
        projectsLoadToken.value++
        projects.value = []
        // Ensure the Project step defaults to creating a new project
        if (!payload.project?.id || payload.project.id.value !== 0) {
          payload.project.id = { value: 0, label: 'New...' }
        }
        return
      }

      const requestToken = ++projectsLoadToken.value
      await loadProjectsForChannelUuid(newUuid, requestToken)
      if (requestToken !== projectsLoadToken.value) return
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
    const requestToken = ++projectsLoadToken.value
    loadProjectsForChannelUuid(ch[0].uuid, requestToken)
  } else {
    projectsLoadToken.value++
    projects.value = []
  }
})

watch(projects, p => {
  if (p.length === 0 && step.value === 3) payload.project.id = { value: 0, label: 'New...' }
  if (p.length === 1 && step.value === 3) {
    payload.project.id = p.map(({ id, title }) => ({ value: id, label: title }))[0]
  }
})

watch(step, (s, previousStep) => {
  if (s === 3 && payload.uuid?.value !== 0 && payload.uuid?.value) {
    const requestToken = ++projectsLoadToken.value
    loadProjectsForChannelUuid(payload.uuid.value, requestToken).then(() => {
      if (requestToken !== projectsLoadToken.value) return
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

  // Entering step 4 should behave the same whether it came from the button
  // or by clicking the step header.
  if (previousStep === 3 && s === 4) {
    scheduleUploadStart()
  }
})

// thumbnail previews for selected files
function watchFileThumb(fileRef, thumbRef) {
  watch(fileRef, (file, _, onCleanup) => {
    if (!file) {
      thumbRef.value = null
      return
    }
    const url = URL.createObjectURL(file)
    thumbRef.value = url
    onCleanup(() => URL.revokeObjectURL(url))
  })
}

watchFileThumb(coverFile, coverThumb)
watchFileThumb(posterFile, posterThumb)
watchFileThumb(previewFile, previewThumb)

watch(mediaFile, file => {
  if (file) {
    payload.project.media.filename = file.name
  } else {
    payload.project.media.filename = null
    disposeFrameSession()
  }
})

// when mediaFile + previewType='frame' changes, extract a random frame and add as preview
// Only trigger extraction when mediaFile or the refresh counter changes.
watch([() => mediaFile.value, () => counter.value], async ([mf]) => {
  const token = ++frameExtractionToken.value
  if (payload.project.media.previewType !== 'frame' || !mf) {
    if (!mf) {
      setPreviewThumbRandom(null)
    }
    return
  }
  try {
    extractingFrame.value = true
    const result = await getRandomFrameFromFile(mf)
    if (token !== frameExtractionToken.value) {
      if (result?.url) URL.revokeObjectURL(result.url)
      return
    }
    setPreviewThumbRandom(result?.url || null)
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
      icon: 'warning',
      actions: [{ label: 'Dismiss', color: 'white' }]
    })
  } finally {
    if (token === frameExtractionToken.value) {
      extractingFrame.value = false
    }
  }
})

watch(
  () => payload.project.media.previewType,
  previewType => {
    if (previewType !== 'frame') {
      frameExtractionToken.value += 1
      setPreviewThumbRandom(null)
      extractingFrame.value = false
    }
  }
)

// Step-specific helpers live in the step components now

// lifecycle
async function loadProjectsForChannelUuid(uuid, requestToken = projectsLoadToken.value) {
  try {
    const chan = await store.cache.dispatch('channel/getChannel', { uuid, pending: true })
    if (requestToken !== projectsLoadToken.value) return
    projects.value = chan?.projects || []
  } catch (err) {
    if (requestToken !== projectsLoadToken.value) return
    console.error('Failed to load channel projects:', err)
    projects.value = []
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to load channel projects.')
    })
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
    const requestToken = ++projectsLoadToken.value
    await loadProjectsForChannelUuid(list[0].uuid, requestToken)
  } else {
    projectsLoadToken.value++
    projects.value = []
  }
  globalThis.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  globalThis.removeEventListener('beforeunload', beforeUnloadHandler)
  setPreviewThumbRandom(null)
  disposeFrameSession()
})

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
