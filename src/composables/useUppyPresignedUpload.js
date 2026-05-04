import { markRaw, reactive, ref, shallowRef } from 'vue'
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
    const state = reactive({
        uploadingFiles: new Map(), // Track files being uploaded and their associated URLs
        completedCount: 0,
        totalCount: 0,
        hasError: false
    })

    function findInstruction(resourceType) {
        return uploadInstructions.value.find(instruction => instruction.resourceType === resourceType)
    }

    function getRequiredResourceTypes() {
        const fromMetadata = uploadInstructions.value[0]?.requiredResources
        if (Array.isArray(fromMetadata) && fromMetadata.length > 0) {
            return [...new Set(fromMetadata)]
        }
        return [...new Set(uploadInstructions.value.map(instruction => instruction.resourceType))]
    }

    /**
     * Initialize Uppy with XHRUpload plugin for presigned URLs.
     * @param {Object[]} instructions - Array of {resourceType, url, reference}
     */
    function initializeUppy(instructions = []) {
        if (client.value) {
            client.value.destroy()
        }

        uploadInstructions.value = instructions

        const nextClient = createPresignedUppyClient({
            id: 'presigned-uploader',
            instructions,
            onProgress: progressData => {
            const totalBytes = progressData?.bytesTotal || 0
            if (!totalBytes) {
                return
            }

            progress.value = Math.round((progressData.bytesUploaded / totalBytes) * 100)
            },
            onUploadSuccess: (file, instruction) => {
                state.completedCount += 1
                state.uploadingFiles.set(file.id, {
                    resourceType: file.meta.resourceType,
                    progress: 100,
                    reference: instruction?.reference || null
                })
                statusText.value = `Uploaded ${state.completedCount} of ${state.totalCount} files.`
            },
            onUploadError: (file, error) => {
                state.hasError = true
                statusText.value = `Upload error: ${error.message}`
                console.error('Error uploading:', file?.name, error)
            }
        })

        client.value = markRaw(nextClient)
        uppy.value = markRaw(nextClient.uppy)

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

        state.uploadingFiles.clear()
        state.completedCount = 0
        state.hasError = false

        uploadItems.forEach(item => {
            const file = item?.file
            const resourceType = item?.resourceType

            if (!file || !resourceType) {
                console.warn('Invalid upload item:', item)
                return
            }

            const fileID = client.value.addFile({
                file,
                resourceType,
                source: 'file-uploader'
            })

            state.uploadingFiles.set(fileID, {
                resourceType,
                progress: 0,
                reference: null
            })
        })

        state.totalCount = state.uploadingFiles.size
        progress.value = 0
        statusText.value = 'Ready to upload...'
    }

    /**
     * Start the upload process.
     * @returns {Promise} Resolves when all uploads complete or rejects on error
     */
    async function startUpload() {
        if (!client.value || state.uploadingFiles.size === 0) {
            throw new Error('No files to upload. Add files with addFilesToUppy() first.')
        }

        state.hasError = false
        state.completedCount = 0
        progress.value = 0
        statusText.value = `Uploading ${state.totalCount} files...`

        try {
            const result = await client.value.uploadAndAssert(getRequiredResourceTypes())

            progress.value = 100
            statusText.value = `Uploaded ${state.completedCount} of ${state.totalCount} files.`

            return result
        } catch (error) {
            state.hasError = true
            statusText.value = `Upload error: ${error.message}`
            throw error
        }
    }

    /**
     * Get the reference ID for a successfully uploaded media file.
     * Returns the reference from the 'upload' resource type (main media file).
     */
    function getMediaReference() {
        for (const info of state.uploadingFiles.values()) {
            if (info.resourceType === 'upload' && info.reference) {
                return info.reference
            }
        }

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
        cleanup()
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
        state.uploadingFiles.clear()
        state.completedCount = 0
        state.totalCount = 0
        state.hasError = false
        uploadInstructions.value = []
    }

    return {
        uppy,
        state,
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
