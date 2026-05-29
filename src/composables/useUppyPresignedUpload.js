import { markRaw, ref, shallowRef } from 'vue'
import { createPresignedUppyClient } from '@clients/uppy-upload-client.js'
import { useAccountStore } from 'src/stores/account-store'

// Manage presigned uploads and expose reactive upload state.
export function useUppyPresignedUpload() {
  const accountStore = useAccountStore()
  const progress = ref(0)
  const statusText = ref('')
  const uppy = shallowRef(null)
  const client = shallowRef(null)
  const uploadInstructions = ref([])
  const completedCount = ref(0)
  const totalCount = ref(0)
  const hasError = ref(false)
  const mediaReference = ref(null)

  function resetUploadState() {
    completedCount.value = 0
    totalCount.value = 0
    hasError.value = false
    progress.value = 0
  }

  // Initialize a new Uppy client from draft upload instructions.
  function initializeUppy(uploadDraft) {
    if (client.value) {
      client.value.destroy()
    }

    const instructions = uploadDraft?.instructions || []
    if (!Array.isArray(instructions) || instructions.length === 0) {
      throw new Error('Upload draft did not include upload instructions.')
    }

    uploadInstructions.value = instructions
    mediaReference.value = uploadDraft?.mediaPrivateId ?? null

    const createdClient = createPresignedUppyClient({
      id: 'presigned-uploader',
      instructions,
      uploadEndpoint: '/api/upload',
      headers: accountStore?.profile?.csrfToken
        ? { 'X-CSRFToken': accountStore.profile.csrfToken }
        : {},
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

  // Queue validated upload items into Uppy and reset progress counters.
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

  // Start upload and fail if any file reports as failed.
  async function startUpload() {
    if (!client.value || totalCount.value === 0) {
      throw new Error('No files to upload. Add files with addFilesToUppy() first.')
    }

    hasError.value = false
    completedCount.value = 0
    progress.value = 0
    statusText.value = `Uploading ${totalCount.value} files...`

    try {
      const result = await client.value.upload()
      const failed = result?.failed || []
      if (failed.length > 0) {
        const failedNames = failed.map(file => file?.name || 'unknown file').join(', ')
        throw new Error(`Upload failed for: ${failedNames}`)
      }

      progress.value = 100
      statusText.value = `Uploaded ${completedCount.value} of ${totalCount.value} files.`

      return result
    } catch (error) {
      hasError.value = true
      statusText.value = `Upload error: ${error.message}`
      throw error
    }
  }

  // Cancel all active transfers while keeping the current client instance.
  function cancelUploads() {
    if (uppy.value) {
      uppy.value.cancelAll()
    }
  }

  // Destroy client and reset all local upload state.
  function cleanup() {
    if (client.value) {
      client.value.destroy()
      client.value = null
      uppy.value = null
    }
    resetUploadState()
    uploadInstructions.value = []
    mediaReference.value = null
  }

  return {
    uppy,
    progress,
    statusText,
    initializeUppy,
    addFilesToUppy,
    startUpload,
    cancelUploads,
    cleanup
  }
}
