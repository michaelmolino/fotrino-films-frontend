import { ref } from 'vue'
import { useUppyPresignedUpload } from './useUppyPresignedUpload.js'

export function useUploadFlow({ uploadStore, getDraftRequest, stepper }) {
  const isUploading = ref(false)
  const abortController = ref(null)
  const activeMediaRef = ref(null)

  const {
    progress,
    statusText,
    initializeUppy,
    addFilesToUppy,
    startUpload,
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
      const draftResult = await uploadStore.postUploadDraft(getDraftRequest())
      const uploadDraft = draftResult?.data

      if (abortController.value.signal.aborted) {
        throw new Error('Upload cancelled')
      }

      const mediaRef = uploadDraft?.mediaId
      if (mediaRef == null) {
        throw new Error('Upload draft did not include a media reference')
      }
      activeMediaRef.value = mediaRef

      initializeUppy(uploadDraft)
      addFilesToUppy(uploadItems)

      await startUpload()

      if (abortController.value.signal.aborted) {
        throw new Error('Upload cancelled')
      }

      await uploadStore.confirmUpload(mediaRef)

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
      cleanup()
      isUploading.value = false
      abortController.value = null
      activeMediaRef.value = null
    }
  }

  function cancel() {
    abortController.value?.abort()
    const mediaRef = activeMediaRef.value

    cancelUploads()
    isUploading.value = false
    progress.value = 0
    statusText.value = 'Upload cancelled.'

    if (mediaRef != null) {
      uploadStore.abortUpload(mediaRef).catch(err => {
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
