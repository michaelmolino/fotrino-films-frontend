import { ref } from 'vue'
import { useUppyPresignedUpload } from './useUppyPresignedUpload.js'
import { usePendingUploadLock } from './usePendingUploadLock.js'

export function useUploadFlow({
    channelStore,
    payload,
    stepper
}) {
    const isUploading = ref(false)
    const abortController = ref(null)
    const uploadLock = usePendingUploadLock()

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

    async function factoryUpload(uploadItems) {
        if (isUploading.value) {
            throw new Error('Upload already in progress.')
        }

        if (!uploadItems || uploadItems.length === 0) {
            throw new Error('No files to upload')
        }

        abortController.value = new AbortController()
        isUploading.value = true

        try {
            const uploadInstructions = await channelStore.postUpload(payload)

            if (abortController.value.signal.aborted) {
                throw new Error('Upload cancelled')
            }

            initializeUppy(uploadInstructions)
            addFilesToUppy(uploadItems)

            const mediaRef = getMediaReference()
            if (mediaRef == null) {
                throw new Error('No media reference available after adding files')
            }

            uploadLock.acquire(mediaRef)

            await startUpload()

            if (abortController.value.signal.aborted) {
                throw new Error('Upload cancelled')
            }

            const confirmMediaRef = getMediaReference()
            if (confirmMediaRef == null) {
                throw new Error('Upload completed without a media reference. Confirm step aborted.')
            }

            await channelStore.confirmUpload(confirmMediaRef)

            statusText.value = 'Upload complete!'
            stepper.value?.next()
        } catch (err) {
            if (abortController.value.signal.aborted && err.message === 'Upload cancelled') {
                return
            }

            progress.value = -1
            statusText.value = err?.message || 'Something went wrong!'
            console.error('Error uploading:', err)
            throw err
        } finally {
            uploadLock.release()
            cleanup()
            isUploading.value = false
            abortController.value = null
        }
    }

    function cancel() {
        abortController.value?.abort()
        const mediaRef = uploadLock.activeMediaRef.value

        uploadLock.release()
        cancelUploads()
        isUploading.value = false
        progress.value = 0
        statusText.value = 'Upload cancelled.'

        if (mediaRef != null) {
            channelStore.abortUpload(mediaRef).catch(err => {
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
