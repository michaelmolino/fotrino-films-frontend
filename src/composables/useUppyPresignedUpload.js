import { markRaw, ref, shallowRef } from 'vue'
import { createPresignedUppyClient } from '@libs/uppy-upload.js'

/**
 * Composable for managing presigned URL uploads with Uppy.
 * Owns and exposes upload progress and status as reactive refs.
 *
 * @returns {Object} uppy instance, methods, progress, statusText, and state
 */
export function useUppyPresignedUpload() {
    const progress = ref(0)
    const statusText = ref(null)
    const uppy = shallowRef(null)
    const client = shallowRef(null)
    const uploadInstructions = ref([])
    const completedCount = ref(0)
    const totalCount = ref(0)
    const hasError = ref(false)

    function findInstruction(resourceType) {
        return uploadInstructions.value.find(instruction => instruction.resourceType === resourceType)
    }

    function resetUploadState() {
        completedCount.value = 0
        totalCount.value = 0
        hasError.value = false
        progress.value = 0
    }

    function getRequiredResourceTypes() {
        return [...new Set(uploadInstructions.value.map(instruction => instruction.resourceType))]
    }

    /**
     * Initialize Uppy for presigned uploads.
     * @param {Object[]} instructions - Array of {resourceType, url, reference}
     */
    function initializeUppy(instructions = []) {
        if (client.value) {
            client.value.destroy()
        }

        uploadInstructions.value = instructions

        const createdClient = createPresignedUppyClient({
            id: 'presigned-uploader',
            instructions,
            onTotalProgress: percent => {
                if (!Number.isFinite(percent)) {
                    return
                }
                progress.value = Math.max(0, Math.min(100, Math.round(percent)))
            },
            onUploadSuccess: () => {
                completedCount.value += 1
                statusText.value = `Uploaded ${completedCount.value} of ${totalCount.value} files.`
            },
            onUploadError: (file, error) => {
                hasError.value = true
                statusText.value = `Upload error: ${error?.message || 'Unknown error'}`
                console.error('Error uploading:', file?.name, error)
            }
        })

        client.value = markRaw(createdClient)
        uppy.value = markRaw(createdClient.uppy)

        return uppy.value
    }

    /**
     * Add files to Uppy for uploading.
     * @param {Array<{ file: File, resourceType: string }>} uploadItems
     */
    function addFilesToUppy(uploadItems) {
        if (!client.value) {
            throw new Error('Uppy not initialized. Call initializeUppy() first.')
        }

        resetUploadState()

        let addedCount = 0

        uploadItems.forEach(item => {
            const file = item?.file
            const resourceType = item?.resourceType

            if (!file || !resourceType) {
                console.warn('Invalid upload item:', item)
                return
            }

            client.value.addFile({
                file,
                resourceType,
                source: 'file-uploader'
            })

            addedCount += 1
        })

        totalCount.value = addedCount
        statusText.value = 'Ready to upload...'
    }

    /**
     * Start the upload process.
     * @returns {Promise} Resolves when all uploads complete or rejects on error
     */
    async function startUpload() {
        if (!client.value || totalCount.value === 0) {
            throw new Error('No files to upload. Add files with addFilesToUppy() first.')
        }

        hasError.value = false
        completedCount.value = 0
        progress.value = 0
        statusText.value = `Uploading ${totalCount.value} files...`

        try {
            const result = await client.value.uploadAndAssert(getRequiredResourceTypes())

            progress.value = 100
            statusText.value = `Uploaded ${completedCount.value} of ${totalCount.value} files.`

            return result
        } catch (error) {
            hasError.value = true
            statusText.value = `Upload error: ${error.message}`
            throw error
        }
    }

    /**
     * Get the reference ID for a successfully uploaded media file.
     * Returns the reference from the 'upload' resource type (main media file).
     */
    function getMediaReference() {
        const uploadInstruction = findInstruction('upload')
        if (uploadInstruction?.reference != null) {
            return uploadInstruction.reference
        }

        return null
    }

    /**
     * Cancel all active uploads and cleanup Uppy instance.
     */
    function cancelUploads() {
        if (uppy.value) {
            uppy.value.cancelAll()
        }
    }

    /**
     * Cleanup and destroy Uppy instance.
     */
    function cleanup() {
        if (client.value) {
            client.value.destroy()
            client.value = null
            uppy.value = null
        }
        resetUploadState()
        uploadInstructions.value = []
    }

    return {
        uppy,
        progress,
        statusText,
        initializeUppy,
        addFilesToUppy,
        startUpload,
        getMediaReference,
        cancelUploads,
        cleanup
    }
}
