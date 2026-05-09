import { ref } from 'vue'
import { useObjectUrl } from '@vueuse/core'
import imageCompression from 'browser-image-compression'
import imageCompressionLibUrl from 'browser-image-compression/dist/browser-image-compression.js?url'
import { notifyError } from 'src/utils/notify.js'

async function compressImageFile(file) {
    if (!file) return file

    const options = {
        fileType: 'image/jpeg',
        maxWidthOrHeight: 720,
        useWebWorker: true,
        libURL: imageCompressionLibUrl
    }

    try {
        const compressed = await imageCompression(file, options)

        if (compressed instanceof File) {
            return compressed
        }

        return new File([compressed], file.name, {
            type: compressed.type || 'image/jpeg',
            lastModified: file.lastModified ?? Date.now()
        })
    } catch (error) {
        console.error('Error processing file:', error)
        notifyError('Error processing image. Using original file.', { timeout: 5000 })
        return file
    }
}

export function useImageFileProcessor() {
    return {
        compressImageFile
    }
}

export function useImageSelectionProcessing() {
    const selectedFile = ref(null)
    const processing = ref(false)
    const previewFile = ref(null)
    const previewUrl = useObjectUrl(previewFile)
    const { compressImageFile } = useImageFileProcessor()

    function clearPreview() {
        previewFile.value = null
    }

    function reset() {
        selectedFile.value = null
        processing.value = false
        clearPreview()
    }

    async function setAndCompressImage(file) {
        if (!file) {
            reset()
            return { file: null, previewUrl: null }
        }

        selectedFile.value = file
        previewFile.value = file
        processing.value = true

        try {
            const processed = await compressImageFile(file)
            selectedFile.value = processed || file
        } finally {
            processing.value = false
        }

        return { file: selectedFile.value, previewUrl: previewUrl.value || null }
    }

    return {
        selectedFile,
        processing,
        previewUrl,
        setAndCompressImage,
        reset,
        clearPreview
    }
}
