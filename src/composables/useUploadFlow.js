import { ref } from 'vue'
import { useUppyPresignedUpload } from './useUppyPresignedUpload.js'
import {
    acquirePendingUploadLock,
    releasePendingUploadLock,
    startPendingUploadLockHeartbeat
} from '@utils/pendingUploadLocks.js'

export function useUploadFlow({
    store,
    payload,
    stepper,
    uploadFiles
}) {
    const isUploading = ref(false)
    // Set to true when cancel() is called so the async catch block in factoryUpload
    // can distinguish a user-initiated cancellation from a real error.
    let cancelled = false
    let activeMediaRef = null
    let stopLockHeartbeat = null

    function startLock(mediaRef) {
        if (mediaRef == null) {
            return
        }
        activeMediaRef = mediaRef
        acquirePendingUploadLock(mediaRef)
        stopLockHeartbeat = startPendingUploadLockHeartbeat(mediaRef)
    }

    function stopLock() {
        if (typeof stopLockHeartbeat === 'function') {
            stopLockHeartbeat()
            stopLockHeartbeat = null
        }
        if (activeMediaRef != null) {
            releasePendingUploadLock(activeMediaRef)
            activeMediaRef = null
        }
    }

    const {
        progress,
        statusText,
        initializeUppy,
        addFilesToUppy,
        startUpload,
        getMediaReference,
        cancelUploads,
        cleanup
    } = useUppyPresignedUpload()

    async function factoryUpload() {
        if (isUploading.value) {
            return
        }

        cancelled = false
        isUploading.value = true
        try {
            // Get presigned upload instructions from backend
            /** @type {import('src/types/api-contract').UploadInstruction[]} */
            const uploadInstructions = await store.dispatch('channel/postUpload', payload)

            // Collect files that need to be uploaded.
            const uploadItems = uploadFiles.value
                .filter(uf => {
                    // Ensure we have a file and a matching upload instruction
                    return uf.file && uploadInstructions.some(ui => ui.resourceType === uf.resourceType)
                })
                .map(uf => ({
                    file: uf.file,
                    resourceType: uf.resourceType
                }))

            if (uploadItems.length === 0) {
                throw new Error('No files to upload')
            }

            // Initialize Uppy with upload instructions
            initializeUppy(uploadInstructions)

            // Add files to upload
            addFilesToUppy(uploadItems)

            const mediaRef = getMediaReference()
            startLock(mediaRef)

            // Start uploads
            await startUpload()

            if (progress.value !== 100) {
                progress.value = 100
            }

            // Get the media reference and confirm upload
            const confirmMediaRef = getMediaReference()
            if (confirmMediaRef == null) {
                throw new Error('Upload completed without a media reference. Confirm step aborted.')
            }
            await store.dispatch('channel/confirmUpload', confirmMediaRef)

            statusText.value = 'Upload complete!'
            stepper.value?.next()
        } catch (err) {
            if (cancelled) {
                // User initiated the cancel; state already set by cancel(). Do not overwrite.
                return
            }
            progress.value = -1
            statusText.value = 'Something went wrong!'
            console.error('Error uploading:', err)
            throw err
        } finally {
            stopLock()
            cleanup()
            isUploading.value = false
        }
    }

    function cancel() {
        cancelled = true
        // Grab the media reference before cleanup clears Uppy state.
        const mediaRef = getMediaReference() ?? activeMediaRef
        stopLock()
        cancelUploads()
        isUploading.value = false
        progress.value = 0
        statusText.value = 'Upload cancelled.'
        if (mediaRef != null) {
            store.dispatch('channel/abortUpload', mediaRef).catch(err => {
                console.warn('Failed to abort pending upload on cancel:', err)
            })
        }
    }

    return {
        factoryUpload,
        cancel,
        progress,
        statusText,
        isUploading
    }
}
