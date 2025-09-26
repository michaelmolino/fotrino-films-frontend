import { ref } from 'vue'
import { Notify } from 'quasar'
import imageCompression from 'browser-image-compression'

export function useFileProcessor() {
  const uploadFiles = ref([])

  async function handleFile(file, resourceType) {
    if (!file) return

    if (['cover', 'poster', 'preview'].includes(resourceType)) {
      // add placeholder entry immediately so uploads see a file exists
      const indexExisting = uploadFiles.value.findIndex(r => r.resourceType === resourceType)
      if (indexExisting === -1) {
        uploadFiles.value.push({ resourceType, file, processing: true })
      } else {
        uploadFiles.value[indexExisting] = { resourceType, file, processing: true }
      }

      // compress in background and replace placeholder when done
      try {
        const options = {
          fileType: 'image/jpeg',
          maxWidthOrHeight: 720,
          useWebWorker: true
        }
        const compressedFile = await imageCompression(file, options)
        const idx = uploadFiles.value.findIndex(r => r.resourceType === resourceType)
        if (idx !== -1) {
          uploadFiles.value[idx].file = compressedFile
          uploadFiles.value[idx].processing = false
        } else {
          uploadFiles.value.push({ resourceType, file: compressedFile, processing: false })
        }
        return compressedFile
      } catch (error) {
        // keep original file but mark processing false and notify user
        const idx = uploadFiles.value.findIndex(r => r.resourceType === resourceType)
        if (idx !== -1) uploadFiles.value[idx].processing = false
        console.error('Error processing file:', error)
        Notify.create({
          type: 'negative',
          message: 'Error processing image. Using original file.',
          timeout: 5000
        })
        return file
      }
    } else if (resourceType === 'upload') {
      const index = uploadFiles.value.findIndex(r => r.resourceType === resourceType)
      if (index !== -1) {
        uploadFiles.value[index].file = file
      } else {
        uploadFiles.value.push({ resourceType: resourceType, file: file })
      }
      return file
    }
  }

  // Extract a random frame from a video File and return an object URL
  async function getRandomFrameFromFile(file) {
    if (!file) return null
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.src = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true

    // attempt to autoplay then pause (iOS hack)
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.then(() => video.pause()).catch(() => {})
    }

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        // pick a random frame
        video.currentTime = Math.random() * video.duration
      }
      video.onseeked = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'))
            return
          }
          try {
            const url = URL.createObjectURL(blob)
            resolve({ url, blob })
          } catch (e) {
            reject(e)
          }
        }, 'image/jpeg')
      }
      video.onerror = e => reject(e)
    })
  }

  return {
    uploadFiles,
    handleFile,
    getRandomFrameFromFile
  }
}
