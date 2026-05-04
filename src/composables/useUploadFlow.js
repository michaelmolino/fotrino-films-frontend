import { useUppyPresignedUpload } from './useUppyPresignedUpload.js'

export function useUploadFlow({
    store,
    payload,
    stepper,
    uploadFiles,
    progress,
    statusText,
    isUploading
}) {
    const { initializeUppy, addFilesToUppy, startUpload, getMediaReference, cleanup } =
        useUppyPresignedUpload({
            progress,
            statusText
        })

    async function factoryUpload() {
        if (isUploading.value) {
            return
        }

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

            // Start uploads
            await startUpload()

            if (progress.value !== 100) {
                progress.value = 100
            }

            // Get the media reference and confirm upload
            const mediaRef = getMediaReference()
            if (mediaRef == null) {
                throw new Error('Upload completed without a media reference. Confirm step aborted.')
            }
            await store.dispatch('channel/confirmUpload', mediaRef)

            statusText.value = 'Upload complete!'
            stepper.value?.next()
        } catch (err) {
            progress.value = -1
            statusText.value = 'Something went wrong!'
            console.error('Error uploading:', err)
            throw err
        } finally {
            cleanup()
            isUploading.value = false
        }
    }

    return {
        factoryUpload
    }
}
