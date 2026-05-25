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

const IMAGE_RESOURCE_TYPES = new Set(['cover', 'poster', 'preview'])

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
    let dismissUploadErrorNotify = null

    const uploadPhaseStepper = ref({
        next() {
            uploadPhase.value = 'complete'
        }
    })

    const { compressImageFile } = useImageFileProcessor()
    const { getRandomFrameFromFile, disposeFrameSession } = useVideoThumbnailProcessor()
    const {
        factoryUpload,
        cancel: cancelUploadInternal,
        progress,
        statusText,
        isUploading
    } = useUploadFlow({
        uploadStore,
        payload,
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
        if (payload.album.id?.value && payload.album.id.value !== 0) {
            return albumsById.value[payload.album.id.value]
        }

        const poster =
            payload.album.id?.value === 0 && payload.album.posterType === 'new' ? posterThumb.value : null

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

    const isMediaReady = computed(() => {
        return (
            !!payload.album?.media?.title &&
            !!mediaFile.value &&
            !isPreviewProcessing.value &&
            ((payload.album.media.previewType === 'new' && !!previewFile.value) ||
                (payload.album.media.previewType === 'frame' && !!previewThumbRandom.value))
        )
    })

    const isChannelReady = computed(() => {
        return (
            payload.publicId !== null &&
            (!!payload.publicId?.value ||
                (!!payload.title && (!!coverFile.value || payload.coverType === 'profile')))
        )
    })

    const isAlbumReady = computed(() => {
        return (
            payload.album.id !== null &&
            (!!payload.album.id?.value ||
                (!!payload.album.title && (!!posterFile.value || payload.album.posterType === 'default')))
        )
    })

    const isReadyToUpload = computed(() => {
        return isMediaReady.value && isChannelReady.value && isAlbumReady.value
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

    function clearUploadErrorNotify() {
        if (typeof dismissUploadErrorNotify === 'function') {
            dismissUploadErrorNotify()
            dismissUploadErrorNotify = null
        }
    }

    function patchPayload(partial) {
        Object.assign(payload, partial)
    }

    function onMediaStepPayloadUpdate(partial) {
        patchPayload(partial)
    }

    async function onMediaStepFileUpdate(fileOrFiles) {
        const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles

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
    }

    function onMediaStepPreviewUpdate(file) {
        handleFile(file, 'preview')
    }

    function onChannelStepPayloadUpdate(partial) {
        patchPayload(partial)
    }

    function onChannelStepCoverUpdate(file) {
        handleFile(file, 'cover')
    }

    function onAlbumStepPayloadUpdate(partial) {
        patchPayload(partial)
    }

    function onAlbumStepPosterUpdate(file) {
        handleFile(file, 'poster')
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
            return
        }

        setSelectedFile(resourceType, file)

        if (resourceType === 'upload') {
            upsertUploadFile('upload', file)
            return
        }

        if (IMAGE_RESOURCE_TYPES.has(resourceType)) {
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

    async function startUploadJourney() {
        if (isUploading.value || uploadTriggered.value) {
            return
        }

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
        payload.idempotencyKey = freshPayload.idempotencyKey
        payload.publicId = freshPayload.publicId
        payload.coverType = freshPayload.coverType
        payload.title = freshPayload.title
        payload.album = freshPayload.album

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
    }

    async function quickUpload() {
        try {
            if (!isMediaReady.value) return

            const ch = channels.value || []
            if (ch.length === 1) {
                payload.publicId = { value: ch[0].publicId, label: ch[0].title }
            } else if (ch.length === 0) {
                payload.publicId = { value: 0, label: 'New...' }
            }

            albums.value = []
            if (payload.publicId?.value && payload.publicId.value !== 0) {
                await loadAlbumsForChannelUuid(payload.publicId.value)
            }

            if (albums.value.length === 1) {
                const p = albums.value[0]
                payload.album.id = { value: p.id, label: p.title }
            } else {
                payload.album.id = { value: 0, label: 'New...' }
            }

            await startUploadJourney()
        } catch (err) {
            console.error('Quick upload setup failed:', err)
            Notify.create({
                type: 'negative',
                message: getComponentApiErrorMessage(err, 'Quick upload failed to initialize.')
            })
        }
    }

    watch(
        () => payload.publicId?.value,
        async newPublicId => {
            try {
                if (!newPublicId || newPublicId === 0) {
                    albumsLoadToken.value++
                    albums.value = []
                    if (payload.album?.id?.value !== 0) {
                        payload.album.id = { value: 0, label: 'New...' }
                    }
                    return
                }

                const requestToken = ++albumsLoadToken.value
                await loadAlbumsForChannelUuid(newPublicId, requestToken)
                if (requestToken !== albumsLoadToken.value) return

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
        if (ch.length === 0 && !payload.publicId) {
            payload.publicId = { value: 0, label: 'New...' }
        }
        if (ch.length === 1 && !payload.publicId) {
            payload.publicId = ch.map(({ publicId, title }) => ({ value: publicId, label: title }))[0]
        }
        if (ch.length === 1) {
            const requestToken = ++albumsLoadToken.value
            loadAlbumsForChannelUuid(ch[0].publicId, requestToken)
        } else {
            albumsLoadToken.value++
            albums.value = []
        }
    })

    watch(albums, p => {
        if (p.length === 0 && payload.album?.id?.value == null) {
            payload.album.id = { value: 0, label: 'New...' }
        }
        if (p.length === 1 && payload.album?.id?.value == null) {
            payload.album.id = p.map(({ id, title }) => ({ value: id, label: title }))[0]
        }
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
        } else {
            payload.album.media.filename = null
            disposeFrameSession()
        }
    })

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
                return
            }

            // If user switches back to frame mode with a selected media file,
            // trigger extraction automatically so a random frame is available.
            if (mediaFile.value) {
                counter.value += 1
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

    async function loadAlbumsForChannelUuid(publicId, requestToken = albumsLoadToken.value) {
        try {
            const existing = (channels.value || []).find(ch => ch?.publicId === publicId)
            if (Array.isArray(existing?.albums)) {
                if (requestToken !== albumsLoadToken.value) return
                albums.value = existing.albums
                return
            }

            let chan = await channelStore.fetchChannel({ channelId: publicId, pending: true, cache: false })
            let albumList = Array.isArray(chan?.albums) ? chan.albums : []

            if (albumList.length === 0) {
                chan = await channelStore.fetchChannel({ channelId: publicId, pending: false, cache: false })
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
        await channelsQuery.refresh()
        const list = channels.value || []
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
