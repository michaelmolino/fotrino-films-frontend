import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { Notify } from 'quasar'
import { useAccountStore } from 'src/stores/account-store.js'
import { useChannelStore } from 'src/stores/channel-store.js'
import { useUploadStore } from 'src/stores/upload-store.js'
import { getComponentApiErrorMessage } from 'src/utils/apiErrors.js'
import { useImageFileProcessor } from '@composables/useImageFileProcessor.js'
import { useVideoThumbnailProcessor } from '@composables/useVideoThumbnailProcessor.js'
import { useUploadFlow } from '@composables/useUploadFlow.js'
import { extractExifDate } from '@composables/useMediaMetadata.js'
import { useDebounceFn } from '@vueuse/core'

const IMAGE_RESOURCE_TYPES = new Set(['cover', 'poster', 'preview'])
const VALIDATION_DEBOUNCE_MS = 300

function createUploadIdempotencyKey() {
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createInitialPayload() {
  return {
    channelMode: 'unselected',
    publicId: null,
    idempotencyKey: createUploadIdempotencyKey(),
    coverType: 'profile',
    title: 'My Channel',
    album: {
      projectMode: 'unselected',
      id: null,
      posterType: 'default',
      posterColor: '#000000',
      title: 'My Videos',
      subtitle: null,
      media: {
        filename: null,
        title: null,
        description: null,
        main: false,
        previewType: 'frame',
        resourceDate: new Date().toISOString().split('T')[0]
      }
    }
  }
}

export function useUploadMediaForm() {
  const accountStore = useAccountStore()
  const channelStore = useChannelStore()
  const uploadStore = useUploadStore()
  const route = useRoute()
  const channelsQuery = channelStore.useChannelsQuery(true)

  const payload = reactive(createInitialPayload())
  const albums = ref([])

  const coverFile = ref(null)
  const coverThumb = ref(null)
  const posterFile = ref(null)
  const posterThumb = ref(null)
  const previewFile = ref(null)
  const previewThumb = ref(null)
  const previewThumbRandom = ref(null)
  const mediaFile = ref(null)

  const uploadFiles = ref([])
  const uploadPhase = ref('editing')
  const counter = ref(0)
  const albumsLoadToken = ref(0)
  const extractingFrame = ref(false)
  const frameExtractionToken = ref(0)
  const uploadTriggered = ref(false)
  const channelsHydrated = ref(false)
  const validation = ref({ canSubmit: false, blockers: [] })
  let validationInFlightPromise = null
  let validationInFlightKey = ''
  let lastValidationKey = ''
  const validationQueued = ref(false)
  let dismissUploadErrorNotify = null

  const uploadPhaseStepper = ref({
    next() {
      uploadPhase.value = 'complete'
    }
  })

  const { compressImageFile } = useImageFileProcessor()
  const { getRandomFrameFromFile, disposeFrameSession } = useVideoThumbnailProcessor()

  function buildChannelSelection() {
    if (payload.channelMode === 'create') {
      const coverMode = payload.coverType === 'new' ? 'upload' : 'profile'
      return {
        mode: 'create',
        title: payload.title,
        cover: {
          mode: coverMode
        }
      }
    }

    if (payload.channelMode === 'existing') {
      const publicId = payload.publicId?.value || null
      return {
        mode: 'existing',
        publicId
      }
    }

    return {
      mode: 'unselected'
    }
  }

  function buildProjectSelection() {
    if (payload.album.projectMode === 'create') {
      const posterMode = payload.album.posterType === 'new' ? 'upload' : 'color'
      const posterColor = payload.album.posterColor || '#000000'
      return {
        mode: 'create',
        title: payload.album.title,
        subtitle: payload.album.subtitle,
        poster: {
          mode: posterMode,
          color: posterColor
        }
      }
    }

    if (payload.album.projectMode === 'existing') {
      return {
        mode: 'existing',
        id: payload.album.id?.value ?? null
      }
    }

    return {
      mode: 'unselected'
    }
  }

  function buildDraftRequest() {
    const channel = buildChannelSelection()
    const project = buildProjectSelection()

    return {
      idempotencyKey: payload.idempotencyKey,
      channel,
      project,
      media: {
        filename: payload.album.media.filename,
        title: payload.album.media.title,
        description: payload.album.media.description,
        main: !!payload.album.media.main,
        preview: {
          mode: payload.album.media.previewType === 'new' ? 'upload' : 'frame'
        },
        resourceDate: payload.album.media.resourceDate
      },
      files: {
        upload: !!mediaFile.value,
        preview:
          payload.album.media.previewType === 'new'
            ? !!previewFile.value
            : !!previewThumbRandom.value,
        cover:
          payload.channelMode === 'create' && payload.coverType === 'new'
            ? !!coverFile.value
            : false,
        poster:
          payload.album.projectMode === 'create' && payload.album.posterType === 'new'
            ? !!posterFile.value
            : false
      }
    }
  }

  const {
    factoryUpload,
    cancel: cancelUploadInternal,
    progress,
    statusText,
    isUploading
  } = useUploadFlow({
    uploadStore,
    getDraftRequest: buildDraftRequest,
    stepper: uploadPhaseStepper
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

  const isPreviewProcessing = computed(() => {
    const preview = uploadFilesByType.value.preview
    return extractingFrame.value || preview?.processing === true
  })

  const profile = computed(() => accountStore.profile)
  const isNewUserProfile = computed(() => {
    if (!profile.value) {
      return false
    }
    return profile.value.newUser === true
  })

  const channels = computed(() => channelsQuery.data.value || [])

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
    if (payload.album.projectMode === 'existing' && payload.album.id?.value) {
      return albumsById.value[payload.album.id.value]
    }

    const poster =
      payload.album.projectMode === 'create' && payload.album.posterType === 'new'
        ? posterThumb.value
        : null

    return {
      title: payload.album.title,
      subtitle: payload.album.subtitle,
      poster,
      posterColor: payload.album.posterColor,
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
    }
    if (previewFile.value && payload.album.media.previewType === 'new') {
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

  const isMediaReady = computed(
    () => !validation.value.blockers.some(blocker => blocker.startsWith('media.'))
  )
  const isChannelReady = computed(
    () => !validation.value.blockers.some(blocker => blocker.startsWith('channel.'))
  )
  const isAlbumReady = computed(
    () => !validation.value.blockers.some(blocker => blocker.startsWith('project.'))
  )
  const isReadyToUpload = computed(
    () => validation.value.canSubmit && !isPreviewProcessing.value && !uploadTriggered.value
  )

  const quickUploadAvailable = computed(() => {
    const channelList = channels.value || []
    if (channelList.length === 0) return true
    if (channelList.length === 1) {
      const projectList = albums.value || []
      return projectList.length <= 1
    }
    return false
  })

  function clearUploadErrorNotify() {
    if (typeof dismissUploadErrorNotify === 'function') {
      dismissUploadErrorNotify()
      dismissUploadErrorNotify = null
    }
  }

  async function refreshValidation({ force = false } = {}) {
    const awaitingFramePreview =
      payload.album.media.previewType === 'frame' && !!mediaFile.value && !previewThumbRandom.value

    if (!force && awaitingFramePreview) {
      return
    }

    const request = buildDraftRequest()
    const requestKey = JSON.stringify(request)

    if (!force && requestKey === lastValidationKey) {
      return
    }

    if (validationInFlightPromise && requestKey === validationInFlightKey) {
      await validationInFlightPromise
      return
    }

    validationInFlightKey = requestKey
    validationInFlightPromise = (async () => {
      try {
        const result = await uploadStore.validateUploadDraft(request)
        validation.value = result?.data || { canSubmit: false, blockers: [] }
        lastValidationKey = requestKey
      } catch {
        validation.value = { canSubmit: false, blockers: ['validation.unavailable'] }
      } finally {
        validationInFlightPromise = null
        validationInFlightKey = ''
      }
    })()

    await validationInFlightPromise
  }

  const debouncedRefreshValidation = useDebounceFn(async () => {
    validationQueued.value = false
    await refreshValidation()
  }, VALIDATION_DEBOUNCE_MS)

  function queueValidation() {
    validationQueued.value = true
    debouncedRefreshValidation()
  }

  function onMediaStepPayloadUpdate(partial) {
    Object.assign(payload.album.media, partial?.album?.media || partial?.media || {})
  }

  async function onMediaStepFileUpdate(fileOrFiles) {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles

    payload.album.media.filename = file?.name || null

    if (file) {
      try {
        const base = (file.name || '').replace(/\.[^/.]+$/, '')
        if (base) {
          payload.album.media.title = base
        }
      } catch (e) {
        console.debug(e)
      }

      try {
        const exifDate = await extractExifDate(file)
        const dateObj = exifDate || (file.lastModified ? new Date(file.lastModified) : new Date())
        if (dateObj && !Number.isNaN(dateObj.getTime())) {
          const yyyy = dateObj.getFullYear()
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
          const dd = String(dateObj.getDate()).padStart(2, '0')
          payload.album.media.resourceDate = `${yyyy}-${mm}-${dd}`
        }
      } catch (e) {
        console.debug(e)
      }
    }

    handleFile(file, 'upload')
    queueValidation()
  }

  function onMediaStepPreviewUpdate(file) {
    handleFile(file, 'preview')
    queueValidation()
  }

  function onChannelStepPayloadUpdate(partial) {
    Object.assign(payload, partial)
    queueValidation()
  }

  function onChannelStepCoverUpdate(file) {
    handleFile(file, 'cover')
    queueValidation()
  }

  function onAlbumStepPayloadUpdate(partial) {
    Object.assign(payload.album, partial?.album || partial)
    queueValidation()
  }

  function onAlbumStepPosterUpdate(file) {
    handleFile(file, 'poster')
    queueValidation()
  }

  function setSelectedFile(resourceType, file) {
    if (resourceType === 'cover') coverFile.value = file
    if (resourceType === 'poster') posterFile.value = file
    if (resourceType === 'preview') previewFile.value = file
    if (resourceType === 'upload') {
      mediaFile.value = file
      payload.album.media.filename = file?.name || null
    }
  }

  function clearUploadFile(resourceType) {
    const uploadFileIndex = uploadFiles.value.findIndex(file => file.resourceType === resourceType)
    if (uploadFileIndex !== -1) {
      uploadFiles.value.splice(uploadFileIndex, 1)
    }
  }

  function upsertUploadFile(resourceType, file, processing) {
    const uploadFileIndex = uploadFiles.value.findIndex(
      entry => entry.resourceType === resourceType
    )
    const entry =
      processing === undefined ? { resourceType, file } : { resourceType, file, processing }
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

  async function handleFile(fileOrFiles, resourceType) {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
    if (!file) {
      setSelectedFile(resourceType, null)
      clearUploadFile(resourceType)
      queueValidation()
      return
    }

    setSelectedFile(resourceType, file)

    if (resourceType === 'upload') {
      upsertUploadFile('upload', file)
      return
    }

    if (IMAGE_RESOURCE_TYPES.has(resourceType)) {
      compressAndStoreImage(resourceType, file)
        .catch(err => {
          console.error('Background file processing error:', err)
        })
        .finally(() => {
          queueValidation()
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

  async function startUploadJourney() {
    if (isUploading.value || uploadTriggered.value) {
      return
    }

    await refreshValidation()
    if (!isReadyToUpload.value) {
      Notify.create({
        type: 'warning',
        message: 'Please complete all required upload details before uploading.'
      })
      return
    }

    clearUploadErrorNotify()
    uploadTriggered.value = true
    uploadPhase.value = 'uploading'
    await nextTick()

    try {
      const uploadItems = uploadFiles.value
        .filter(item => item.file != null)
        .map(item => ({
          file: item.file,
          resourceType: item.resourceType
        }))

      await factoryUpload(uploadItems)
      clearUploadErrorNotify()
    } catch (err) {
      statusText.value = getComponentApiErrorMessage(err, 'Something went wrong!')
      clearUploadErrorNotify()
      dismissUploadErrorNotify = Notify.create({
        type: 'negative',
        timeout: 0,
        multiLine: false,
        message: statusText.value,
        icon: 'warning',
        actions: [{ label: 'Dismiss', color: 'white' }]
      })
    } finally {
      uploadTriggered.value = false
    }
  }

  function cancelUpload() {
    cancelUploadInternal()
  }

  function resetUploadFlow() {
    if (isUploading.value) {
      return
    }

    const freshPayload = createInitialPayload()
    Object.assign(payload, freshPayload)

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
    uploadPhase.value = 'editing'

    setPreviewThumbRandom(null)
    clearUploadErrorNotify()
    disposeFrameSession()
    uploadFiles.value.splice(0, uploadFiles.value.length)
    validation.value = { canSubmit: false, blockers: [] }
  }

  async function quickUpload() {
    await refreshValidation()
    if (!isReadyToUpload.value) {
      return
    }
    await startUploadJourney()
  }

  async function loadAlbumsForChannelUuid(publicId, requestToken = albumsLoadToken.value) {
    try {
      const existing = (channels.value || []).find(ch => ch?.publicId === publicId)
      if (Array.isArray(existing?.albums)) {
        if (requestToken !== albumsLoadToken.value) return
        albums.value = existing.albums
        return
      }

      let chan = await channelStore.fetchChannel({
        channelId: publicId,
        pending: true,
        cache: false
      })
      let albumList = Array.isArray(chan?.albums) ? chan.albums : []

      if (albumList.length === 0) {
        chan = await channelStore.fetchChannel({
          channelId: publicId,
          pending: false,
          cache: false
        })
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

  function setDefaultChannelSelection(channelList) {
    if (payload.channelMode !== 'unselected') {
      return
    }

    if (channelList.length === 0) {
      payload.channelMode = 'create'
      payload.publicId = null
      return
    }

    if (channelList.length === 1) {
      payload.channelMode = 'existing'
      payload.publicId = { value: channelList[0].publicId, label: channelList[0].title }
      return
    }

    payload.channelMode = 'unselected'
    payload.publicId = null
  }

  function setDefaultProjectSelection(projectList) {
    if (payload.album.projectMode !== 'unselected') {
      return
    }

    if (projectList.length === 0) {
      payload.album.projectMode = 'create'
      payload.album.id = null
      return
    }

    if (projectList.length === 1) {
      payload.album.projectMode = 'existing'
      payload.album.id = { value: projectList[0].id, label: projectList[0].title }
      return
    }

    payload.album.projectMode = 'unselected'
    payload.album.id = null
  }

  watch(
    () => payload.publicId?.value,
    async newPublicId => {
      if (payload.channelMode === 'create') {
        albumsLoadToken.value += 1
        albums.value = []
        payload.album.projectMode = 'create'
        payload.album.id = null
        queueValidation()
        return
      }

      if (payload.channelMode !== 'existing' || !newPublicId) {
        albumsLoadToken.value += 1
        albums.value = []
        payload.album.projectMode = 'unselected'
        payload.album.id = null
        queueValidation()
        return
      }

      payload.album.projectMode = 'unselected'
      payload.album.id = null

      const requestToken = ++albumsLoadToken.value
      await loadAlbumsForChannelUuid(newPublicId, requestToken)
      if (requestToken !== albumsLoadToken.value) return

      setDefaultProjectSelection(albums.value || [])
      queueValidation()
    }
  )

  watch(
    () => payload.channelMode,
    channelMode => {
      if (channelMode === 'create') {
        albumsLoadToken.value += 1
        albums.value = []
        payload.album.projectMode = 'create'
        payload.album.id = null
        queueValidation()
        return
      }

      if (channelMode !== 'existing') {
        albumsLoadToken.value += 1
        albums.value = []
        payload.album.projectMode = 'unselected'
        payload.album.id = null
        queueValidation()
        return
      }

      if (!payload.publicId?.value) {
        albumsLoadToken.value += 1
        albums.value = []
        payload.album.projectMode = 'unselected'
        payload.album.id = null
        queueValidation()
      }
    }
  )

  watch(channels, channelList => {
    if (!channelsHydrated.value) {
      return
    }

    setDefaultChannelSelection(channelList || [])

    if (payload.channelMode === 'existing' && payload.publicId?.value) {
      const requestToken = ++albumsLoadToken.value
      void loadAlbumsForChannelUuid(payload.publicId.value, requestToken)
    } else {
      albumsLoadToken.value++
      albums.value = []
    }

    queueValidation()
  })

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
      if (payload.album.media.previewType === 'frame') {
        setPreviewThumbRandom(null)
      }
    } else {
      payload.album.media.filename = null
      disposeFrameSession()
    }
    queueValidation()
  })

  watch([() => mediaFile.value, () => counter.value], async ([mf]) => {
    const token = ++frameExtractionToken.value
    if (payload.album.media.previewType !== 'frame' || !mf) {
      if (!mf) {
        setPreviewThumbRandom(null)
      }
      queueValidation()
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
      queueValidation()
    }
  })

  watch(
    () => payload.album.media.previewType,
    previewType => {
      if (previewType !== 'frame') {
        frameExtractionToken.value += 1
        setPreviewThumbRandom(null)
        extractingFrame.value = false
      } else if (mediaFile.value) {
        counter.value += 1
      }
      queueValidation()
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

  const beforeUnloadHandler = event => {
    if (isUploading.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }

  onMounted(async () => {
    await channelsQuery.refresh()
    channelsHydrated.value = true

    const list = channels.value || []
    setDefaultChannelSelection(list)

    if (payload.channelMode === 'existing' && payload.publicId?.value) {
      const requestToken = ++albumsLoadToken.value
      await loadAlbumsForChannelUuid(payload.publicId.value, requestToken)
      setDefaultProjectSelection(albums.value || [])
    }

    await refreshValidation({ force: true })
    globalThis.addEventListener('beforeunload', beforeUnloadHandler)
  })

  onBeforeUnmount(() => {
    globalThis.removeEventListener('beforeunload', beforeUnloadHandler)
    if (typeof debouncedRefreshValidation.cancel === 'function') {
      debouncedRefreshValidation.cancel()
    }
    setPreviewThumbRandom(null)
    disposeFrameSession()
  })

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

  return {
    payload,
    profile,
    isNewUserProfile,
    channels,
    albums,
    album,
    media,
    coverFile,
    coverThumb,
    posterFile,
    previewFile,
    mediaFile,
    isPreviewProcessing,
    isMediaReady,
    isChannelReady,
    isAlbumReady,
    isReadyToUpload,
    quickUploadAvailable,
    uploadPhase,
    isUploading,
    progress,
    statusText,
    validation,
    cancelUpload,
    startUploadJourney,
    quickUpload,
    resetUploadFlow,
    handleFile,
    incrementCounter,
    onMediaStepPayloadUpdate,
    onMediaStepFileUpdate,
    onMediaStepPreviewUpdate,
    onChannelStepPayloadUpdate,
    onChannelStepCoverUpdate,
    onAlbumStepPayloadUpdate,
    onAlbumStepPosterUpdate
  }
}
