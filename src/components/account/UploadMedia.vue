<template>
  <div v-if="profile?.id" class="q-pa-md" data-cy="upload-page">
    <q-item class="q-pb-md">
      <q-item-section>
        <q-item-label class="text-h5">Upload Video</q-item-label>
      </q-item-section>
    </q-item>
    <q-banner
      v-if="isNewUserProfile"
      rounded
      class="bg-orange-1 text-orange-10 q-pa-md"
      data-cy="upload-verification-pending-message">
      Uploads are currently disabled pending account verification, which usually happens within 24 hours.
    </q-banner>
    <q-stepper
      v-else
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

      <!-- Step 3: Album -->
      <q-step
        :name="3"
        :title="stepTitles.album"
        icon="theaters"
        :done="step > 3"
        :header-nav="canOpenStepFromHeader(3)">
        <AlbumStep
          class="step"
          :payload="payload"
          :albums="albums"
          :album="album"
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
          <div class="upload-preview-shell">
            <MediaPreview :media="media" :album="album" :detail="false" class="upload-preview" />
            <div class="upload-progress-overlay" data-cy="upload-progress-overlay">
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
        title="Upload Complete"
        icon="check_circle"
        active-icon="check_circle"
        data-cy="upload-step-processing"
        :header-nav="false">
        <div class="text-center">
          <div class="upload-preview-shell q-mb-md">
            <MediaPreview
              :media="media"
              :album="album"
              :detail="true"
              class="processing-preview" />
            <div class="upload-complete-overlay" data-cy="upload-complete-status">
              <q-icon name="check_circle" size="64px" color="info" />
            </div>
          </div>
          <div class="processing-status" data-cy="upload-processing-status">
            <span class="text-h6" data-cy="upload-processing-text">Upload complete</span>
          </div>
          <div class="q-pa-md text-body2">
            <strong>{{ media.title }}</strong> was uploaded successfully.
            Your video is being processed. We will email you when your video is live.
          </div>
          <div class="q-pt-md text-caption text-grey-6">You can safely close this window.</div>
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
  <AuthRequired v-else type="login" message="Please log in to upload videos." />
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import { useChannelStore } from 'src/stores/channel-store.js'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import ChannelStep from './UploadMedia/ChannelStep.vue'
import AlbumStep from './UploadMedia/AlbumStep.vue'
import MediaStep from './UploadMedia/MediaStep.vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { Notify } from 'quasar'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'
import { useImageFileProcessor } from '@composables/useImageFileProcessor.js'
import { useVideoThumbnailProcessor } from '@composables/useVideoThumbnailProcessor.js'
import { useUploadFlow } from '@composables/useUploadFlow.js'

const IMAGE_RESOURCE_TYPES = new Set(['cover', 'poster', 'preview'])

// refs & reactive state
const accountStore = useAccountStore()
const channelStore = useChannelStore()
const route = useRoute()
const step = ref(1)
const stepper = ref(null)
const albums = ref([])
/** @type {import('src/types/api-contract').ApiContracts['UploadMediaRequest']} */
function createUploadIdempotencyKey() {
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createInitialPayload() {
  return {
    publicId: null,
    idempotencyKey: createUploadIdempotencyKey(),
    coverType: 'profile',
    title: 'My Channel',
    album: {
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
}
const payload = reactive(createInitialPayload())

const coverFile = ref(null)
const coverThumb = ref(null)
const posterFile = ref(null)
const posterThumb = ref(null)
const previewFile = ref(null)
const previewThumb = ref(null)
const previewThumbRandom = ref(null)
const mediaFile = ref(null)
const counter = ref(0)
const albumsLoadToken = ref(0)
const extractingFrame = ref(false)
const frameExtractionToken = ref(0)
const uploadTriggered = ref(false)
let dismissUploadErrorNotify = null

const uploadFiles = ref([])
const { compressImageFile } = useImageFileProcessor()
const { getRandomFrameFromFile, disposeFrameSession } = useVideoThumbnailProcessor()
const { factoryUpload, cancel: cancelUpload, progress, statusText, isUploading } = useUploadFlow({
  channelStore,
  payload,
  stepper
})

const isPreviewProcessing = computed(() => {
  const preview = uploadFilesByType.value.preview
  return extractingFrame.value || (preview && preview.processing === true)
})

const uploadFilesByType = computed(() => {
  const byType = {}
  for (const item of uploadFiles.value) {
    if (item?.resourceType) {
      byType[item.resourceType] = item
    }
  }
  return byType
})

const stepTitles = computed(() => ({
  media: step.value > 1 ? media.value.title : 'Video',
  channel: step.value > 2 ? payload.title : 'Channel',
  album: step.value > 3 ? album.value.title : 'Album'
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

function upsertUploadFile(resourceType, file, processing) {
  const uploadFileIndex = uploadFiles.value.findIndex(entry => entry.resourceType === resourceType)
  const entry = processing === undefined ? { resourceType, file } : { resourceType, file, processing }
  if (uploadFileIndex === -1) {
    uploadFiles.value.push(entry)
    return
  }
  uploadFiles.value[uploadFileIndex] = { ...uploadFiles.value[uploadFileIndex], ...entry }
}

async function compressAndStoreImage(resourceType, file) {
  upsertUploadFile(resourceType, file, true)
  const processed = await compressImageFile(file)
  upsertUploadFile(resourceType, processed, false)
  return processed
}

// Keep a template-friendly handleFile function name (wrapper)
async function handleFile(fileOrFiles, resourceType) {
  // normalize Quasar QFile which may pass an array
  const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
  if (!file) {
    setSelectedFile(resourceType, null)
    clearUploadFile(resourceType)
    return
  }

  // set the correct local ref so watchers and template stay in sync
  setSelectedFile(resourceType, file)

  if (resourceType === 'upload') {
    upsertUploadFile('upload', file)
    return
  }

  if (IMAGE_RESOURCE_TYPES.has(resourceType)) {
    // start processing in background so thumbnail appears immediately
    compressAndStoreImage(resourceType, file).catch(err => {
      console.error('Background file processing error:', err)
    })
  }
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
    const uploadItems = uploadFiles.value
      .filter(item => item.file != null)
      .map(item => ({
        file: item.file,
        resourceType: item.resourceType
      }))

    await factoryUpload(uploadItems)
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
    resetAlbumStep()
  }

  stepper.value.previous()
}

function resetChannelStep() {
  payload.publicId = null
  payload.coverType = 'profile'
  payload.title = 'My Channel'
  coverFile.value = null
  coverThumb.value = null
  clearUploadFile('cover')
}

function resetAlbumStep() {
  payload.album.id = null
  payload.album.posterType = 'default'
  payload.album.title = 'My Videos'
  posterFile.value = null
  posterThumb.value = null
  clearUploadFile('poster')
}

function resetUploadFlow() {
  if (isUploading.value) {
    return
  }

  const freshPayload = createInitialPayload()
  payload.publicId = freshPayload.publicId
  payload.coverType = freshPayload.coverType
  payload.title = freshPayload.title
  payload.album = freshPayload.album

  step.value = 1
  coverFile.value = null
  coverThumb.value = null
  posterFile.value = null
  posterThumb.value = null
  previewFile.value = null
  previewThumb.value = null
  mediaFile.value = null
  counter.value = 0
  frameExtractionToken.value += 1
  extractingFrame.value = false
  uploadTriggered.value = false
  progress.value = 0
  statusText.value = 'Preparing upload...'

  setPreviewThumbRandom(null)
  clearUploadErrorNotify()
  disposeFrameSession()
  uploadFiles.value.splice(0, uploadFiles.value.length)
}

// computed
const profile = computed(() => accountStore.profile)
const isNewUserProfile = computed(() => {
  if (!profile.value) {
    return false
  }
  return profile.value.newUser === true
})
const channels = computed(() => channelStore.channels)
const albumsById = computed(() => {
  const map = {}
  for (const item of albums.value || []) {
    if (item?.id != null) {
      map[item.id] = item
    }
  }
  return map
})

const album = computed(() => {
  // If selecting an existing album, return it from the list
  if (payload.album.id?.value && payload.album.id.value !== 0) {
    return albumsById.value[payload.album.id.value]
  }

  // Creating a new album - determine poster
  const poster =
    payload.album.id?.value === 0 && payload.album.posterType === 'new'
      ? posterThumb.value
      : null

  // Return new album structure
  return {
    title: payload.album.title,
    subtitle: payload.album.subtitle,
    poster,
    media: []
  }
})

const media = computed(() => {
  if (mediaFile.value && payload.album.media.previewType === 'frame') {
    return {
      title: payload.album.media.title,
      description: payload.album.media.description,
      main: payload.album.media.main,
      preview: previewThumbRandom.value
    }
  } else if (previewFile.value && payload.album.media.previewType === 'new') {
    return {
      title: payload.album.media.title,
      description: payload.album.media.description,
      main: payload.album.media.main,
      preview: previewThumb.value
    }
  }
  return {
    title: payload.album.media.title,
    description: payload.album.media.description,
    main: payload.album.media.main
  }
})

const next = computed(() => {
  switch (step.value) {
    case 1: // Media
      return (
        !!payload.album?.media?.title &&
        !!mediaFile.value &&
        !isPreviewProcessing.value &&
        ((payload.album.media.previewType === 'new' && !!previewFile.value) ||
          (payload.album.media.previewType === 'frame' && !!previewThumbRandom.value))
      )
    case 2: // Channel
      return (
        payload.publicId !== null &&
        (!!payload.publicId?.value ||
          (!!payload.title && (!!coverFile.value || payload.coverType === 'profile')))
      )
    case 3: // Album
      return (
        payload.album.id !== null &&
        (!!payload.album.id?.value ||
          (!!payload.album.title &&
            (!!posterFile.value || payload.album.posterType === 'default')))
      )
    default:
      return false
  }
})

const quickUploadAvailable = computed(() => {
  const ch = channels.value || []
  if (ch.length === 0) return true
  if (ch.length === 1) {
    const p = albums.value || []
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
      payload.publicId = { value: ch[0].publicId, label: ch[0].title }
    } else if (ch.length === 0) {
      payload.publicId = { value: 0, label: 'New...' }
    }
    // Resolve albums if channel exists
    albums.value = []
    if (payload.publicId && payload.publicId.value && payload.publicId.value !== 0) {
      await loadAlbumsForChannelUuid(payload.publicId.value)
    }
    // Select or create album
    if (albums.value.length === 1) {
      const p = albums.value[0]
      payload.album.id = { value: p.id, label: p.title }
    } else {
      payload.album.id = { value: 0, label: 'New...' }
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
// Keep albums in sync with the selected channel. If 'New...' is selected, there are no albums.
watch(
  () => payload.publicId?.value,
  async newPublicId => {
    try {
      if (!newPublicId || newPublicId === 0) {
        albumsLoadToken.value++
        albums.value = []
        // Ensure the Album step defaults to creating a new album
        if (!payload.album?.id || payload.album.id.value !== 0) {
          payload.album.id = { value: 0, label: 'New...' }
        }
        return
      }

      const requestToken = ++albumsLoadToken.value
      await loadAlbumsForChannelUuid(newPublicId, requestToken)
      if (requestToken !== albumsLoadToken.value) return
      // If the previously selected album isn't part of this channel, reset selection
      const currentId = payload.album?.id?.value
      const found = currentId && albumsById.value[currentId] != null
      if (!found) {
        if (albums.value.length === 1) {
          const p = albums.value[0]
          payload.album.id = { value: p.id, label: p.title }
        } else {
          payload.album.id = { value: 0, label: 'New...' }
        }
      }
    } catch (err) {
      console.error('Failed syncing albums with channel selection:', err)
      albums.value = []
      payload.album.id = { value: 0, label: 'New...' }
    }
  }
)

watch(channels, ch => {
  if (ch.length === 0 && step.value === 2) payload.publicId = { value: 0, label: 'New...' }
  if (ch.length === 1 && step.value === 2) {
    payload.publicId = ch.map(({ publicId, title }) => ({ value: publicId, label: title }))[0]
  }
  // Keep albums in sync for quick upload checks
  if (ch.length === 1) {
    const requestToken = ++albumsLoadToken.value
    loadAlbumsForChannelUuid(ch[0].publicId, requestToken)
  } else {
    albumsLoadToken.value++
    albums.value = []
  }
})

watch(albums, p => {
  if (p.length === 0 && step.value === 3) payload.album.id = { value: 0, label: 'New...' }
  if (p.length === 1 && step.value === 3) {
    payload.album.id = p.map(({ id, title }) => ({ value: id, label: title }))[0]
  }
})

watch(step, (s, previousStep) => {
  if (s === 3 && payload.publicId?.value !== 0 && payload.publicId?.value) {
    const requestToken = ++albumsLoadToken.value
    loadAlbumsForChannelUuid(payload.publicId.value, requestToken).then(() => {
      if (requestToken !== albumsLoadToken.value) return
      if (albums.value.length === 0) payload.album.id = { value: 0, label: 'New...' }
      if (albums.value.length === 1) {
        payload.album.id = albums.value.map(({ id, title }) => ({
          value: id,
          label: title
        }))[0]
      }
    })
  } else if (albums.value.length === 0 && s === 3) {
    payload.album.id = { value: 0, label: 'New...' }
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
    payload.album.media.filename = file.name
  } else {
    payload.album.media.filename = null
    disposeFrameSession()
  }
})

// when mediaFile + previewType='frame' changes, extract a random frame and add as preview
// Only trigger extraction when mediaFile or the refresh counter changes.
watch([() => mediaFile.value, () => counter.value], async ([mf]) => {
  const token = ++frameExtractionToken.value
  if (payload.album.media.previewType !== 'frame' || !mf) {
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
      await compressAndStoreImage('preview', file)
    }
  } catch (err) {
    console.error(err)
    payload.album.media.previewType = 'new'
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
  () => payload.album.media.previewType,
  previewType => {
    if (previewType !== 'frame') {
      frameExtractionToken.value += 1
      setPreviewThumbRandom(null)
      extractingFrame.value = false
    }
  }
)

watch(
  () => route.query.u,
  freshUploadToken => {
    if (!freshUploadToken) {
      return
    }
    resetUploadFlow()
  }
)

// Step-specific helpers live in the step components now

// lifecycle
async function loadAlbumsForChannelUuid(publicId, requestToken = albumsLoadToken.value) {
  try {
    const existing = (channels.value || []).find(ch => ch?.publicId === publicId)
    if (Array.isArray(existing?.albums)) {
      if (requestToken !== albumsLoadToken.value) return
      albums.value = existing.albums
      return
    }

    // Avoid cache key collisions between pending/non-pending variants.
    let chan = await channelStore.loadChannel({ channelId: publicId, pending: true, cache: false })
    let albumList = Array.isArray(chan?.albums) ? chan.albums : []

    if (albumList.length === 0) {
      chan = await channelStore.loadChannel({ channelId: publicId, pending: false, cache: false })
      albumList = Array.isArray(chan?.albums) ? chan.albums : []
    }

    if (requestToken !== albumsLoadToken.value) return
    albums.value = albumList
  } catch (err) {
    if (requestToken !== albumsLoadToken.value) return
    console.error('Failed to load channel albums:', err)
    albums.value = []
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to load channel albums.')
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
  await channelStore.loadChannels(true)
  const list = channelStore.channels || []
  if (list.length === 1) {
    const requestToken = ++albumsLoadToken.value
    await loadAlbumsForChannelUuid(list[0].publicId, requestToken)
  } else {
    albumsLoadToken.value++
    albums.value = []
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

.upload-preview-shell {
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.upload-preview {
  width: 100%;
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
  pointer-events: none;
}

.upload-complete-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
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
  width: 100%;
  margin: 0 auto;
}

.processing-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
</style>
