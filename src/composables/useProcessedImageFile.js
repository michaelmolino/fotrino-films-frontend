import { onBeforeUnmount, ref } from 'vue'
import { useFileProcessor } from './useFileProcessor.js'

export function useProcessedImageFile(resourceType) {
    const selectedFile = ref(null)
    const processing = ref(false)
    const localObjectUrl = ref(null)
    const { handleFile } = useFileProcessor()
    let processVersion = 0

    function clearLocalObjectUrl() {
        if (localObjectUrl.value) {
            URL.revokeObjectURL(localObjectUrl.value)
            localObjectUrl.value = null
        }
    }

    function reset() {
        processVersion += 1
        selectedFile.value = null
        processing.value = false
        clearLocalObjectUrl()
    }

    async function processSelectedFile(fileOrFiles) {
        const currentVersion = ++processVersion
        const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
        if (!file) {
            reset()
            return { file: null, previewUrl: null }
        }

        selectedFile.value = file
        const previewUrl = URL.createObjectURL(file)
        clearLocalObjectUrl()
        localObjectUrl.value = previewUrl

        processing.value = true
        try {
            const processed = await handleFile(file, resourceType)
            if (currentVersion !== processVersion) {
                return { file: selectedFile.value, previewUrl: localObjectUrl.value }
            }
            selectedFile.value = processed || file
        } finally {
            if (currentVersion === processVersion) {
                processing.value = false
            }
        }

        return { file: selectedFile.value, previewUrl }
    }

    onBeforeUnmount(() => {
        clearLocalObjectUrl()
    })

    return {
        selectedFile,
        processing,
        localObjectUrl,
        processSelectedFile,
        reset,
        clearLocalObjectUrl
    }
}
