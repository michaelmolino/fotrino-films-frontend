import { nextTick, ref, watch } from 'vue'
import { useUppyPresignedUpload } from './useUppyPresignedUpload.js'
import {
    acquirePendingUploadLock,
    releasePendingUploadLock,
    startPendingUploadLockHeartbeat
} from '@utils/pendingUploadLocks.js'

function getRequiredUploadTypes(uploadInstructions) {
    return new Set(uploadInstructions.map(instruction => instruction.resourceType))
}

function getPendingUploadTypes(files, requiredTypes) {
    return files
        .filter(uf => requiredTypes.has(uf.resourceType) && uf.processing === true)
        .map(uf => uf.resourceType)
}

async function waitForUploadItemsReady(uploadFiles, uploadInstructions, timeoutMs = 5000) {
    const requiredTypes = getRequiredUploadTypes(uploadInstructions)
    const currentPendingTypes = () => getPendingUploadTypes(uploadFiles.value, requiredTypes)

    if (currentPendingTypes().length === 0) {
        return
    }

    await new Promise((resolve, reject) => {
        let settled = false
        let stopWatching = null

        const finish = callback => {
            if (settled) {
                return
            }
            settled = true
            clearTimeout(timeoutId)
            if (typeof stopWatching === 'function') {
                stopWatching()
            }
            callback()
        }

        const timeoutId = setTimeout(() => {
            const pendingTypes = currentPendingTypes()
            finish(() => {
                reject(new Error(`Files still processing: ${pendingTypes.join(', ')}`))
            })
        }, timeoutMs)

        stopWatching = watch(
            uploadFiles,
            files => {
                const pendingTypes = getPendingUploadTypes(files, requiredTypes)
                if (pendingTypes.length === 0) {
                    finish(resolve)
                }
            },
            { deep: true, flush: 'post' }
        )
    })
}

function buildUploadItems(uploadFiles, uploadInstructions) {
    const requiredTypes = getRequiredUploadTypes(uploadInstructions)

    return uploadFiles.value
        .filter(uploadFile => uploadFile.file && requiredTypes.has(uploadFile.resourceType))
        .map(uploadFile => ({
            file: uploadFile.file,
            resourceType: uploadFile.resourceType
        }))
}

export function useUploadFlow({
    store,
    payload,
    stepper,
    uploadFiles
}) {
    const isUploading = ref(false)
    let cancelled = false
    let activeMediaRef = null
    let stopLockHeartbeat = null

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

    const startLock = mediaRef => {
        if (mediaRef == null) {
            return
        }

        activeMediaRef = mediaRef
        acquirePendingUploadLock(mediaRef)
        stopLockHeartbeat = startPendingUploadLockHeartbeat(mediaRef)
    }

    const stopLock = () => {
        if (typeof stopLockHeartbeat === 'function') {
            stopLockHeartbeat()
            stopLockHeartbeat = null
        }
        if (activeMediaRef != null) {
            releasePendingUploadLock(activeMediaRef)
            activeMediaRef = null
        }
    }

    async function factoryUpload() {
        if (isUploading.value) {
            throw new Error('Upload already in progress.')
        }

        cancelled = false
        isUploading.value = true

        try {
            const uploadInstructions = await store.dispatch('channel/postUpload', payload)

            // Allow any in-flight reactive updates to settle before reading uploadFiles.
            await nextTick()
            await waitForUploadItemsReady(uploadFiles, uploadInstructions)

            const uploadItems = buildUploadItems(uploadFiles, uploadInstructions)
            if (uploadItems.length === 0) {
                throw new Error('No files to upload')
            }

            initializeUppy(uploadInstructions)
            addFilesToUppy(uploadItems)

            const mediaRef = getMediaReference()
            startLock(mediaRef)

            await startUpload()

            const confirmMediaRef = getMediaReference()
            if (confirmMediaRef == null) {
                throw new Error('Upload completed without a media reference. Confirm step aborted.')
            }
            await store.dispatch('channel/confirmUpload', confirmMediaRef)

            statusText.value = 'Upload complete!'
            stepper.value?.next()
        } catch (err) {
            if (cancelled) {
                return
            }

            progress.value = -1
            statusText.value = err?.message || 'Something went wrong!'
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
