import { objectApi } from 'boot/axios'

export function useUploadFlow({ store, payload, stepper, uploadFiles, progress, statusText, isUploading }) {
    function onUploadProgress(progressEvent) {
        progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    async function uploadSingle(uploadInstruction, current, total) {
        const item = uploadFiles.value.find(f => f.resourceType === uploadInstruction.resourceType)
        const file = item?.file
        if (!file) throw new Error(`Missing file for ${uploadInstruction.resourceType}`)

        statusText.value = `Uploading file ${current} of ${total}. Do not navigate away from this page!`
        await objectApi.put(uploadInstruction.url, file, {
            headers: { 'Content-Type': file.type },
            onUploadProgress
        })
        return uploadInstruction.resourceType === 'upload' ? uploadInstruction.reference : null
    }

    async function factoryUpload() {
        isUploading.value = true
        try {
            /** @type {import('src/types/api-contract').UploadInstruction[]} */
            const upload = await store.dispatch('channel/postUpload', payload)
            const total = upload.length
            let mediaRef = null

            for (const [index, uploadInstruction] of upload.entries()) {
                progress.value = 0
                try {
                    const maybeMedia = await uploadSingle(uploadInstruction, index + 1, total)
                    if (maybeMedia) mediaRef = maybeMedia
                } catch (err) {
                    progress.value = -1
                    statusText.value = 'Something went wrong!'
                    console.error('Error uploading:', err)
                    isUploading.value = false
                    throw err
                }
            }

            await store.dispatch('channel/confirmUpload', mediaRef)
            stepper.value?.next()
            isUploading.value = false
        } catch (err) {
            isUploading.value = false
            progress.value = -1
            statusText.value = 'Something went wrong!'
            throw err
        }
    }

    return {
        factoryUpload
    }
}
