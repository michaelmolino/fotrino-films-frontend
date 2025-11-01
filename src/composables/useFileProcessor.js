import { ref } from 'vue'
import { Notify } from 'quasar'
import imageCompression from 'browser-image-compression'

async function compressImage(file) {
  const options = { fileType: 'image/jpeg', maxWidthOrHeight: 720, useWebWorker: true }
  return imageCompression(file, options)
}

function waitForVideoEvent(video, eventName) {
  return new Promise((resolve, reject) => {
    const onEvent = () => {
      cleanup()
      resolve()
    }
    const onError = e => {
      cleanup()
      reject(e)
    }
    const cleanup = () => {
      video.removeEventListener(eventName, onEvent)
      video.removeEventListener('error', onError)
    }
    video.addEventListener(eventName, onEvent, { once: true })
    video.addEventListener('error', onError, { once: true })
  })
}

function toBlobAsync(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob from canvas'))
    }, type)
  })
}

function waitForSeek(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onError = e => {
      cleanup()
      reject(e)
    }
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }
    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })
    // trigger seek after listeners are attached to avoid missing the event
    video.currentTime = time
  })
}

export function useFileProcessor() {
  const uploadFiles = ref([])

  const IMAGE_TYPES = new Set(['cover', 'poster', 'preview'])

  function findIndex(resourceType) {
    return uploadFiles.value.findIndex(r => r.resourceType === resourceType)
  }

  function upsertEntry(resourceType, file, processing) {
    const idx = findIndex(resourceType)
    const entry = { resourceType, file, ...(processing !== undefined ? { processing } : {}) }
    if (idx === -1) uploadFiles.value.push(entry)
    else uploadFiles.value[idx] = { ...uploadFiles.value[idx], ...entry }
  }

  function markProcessing(resourceType, processing) {
    const idx = findIndex(resourceType)
    if (idx !== -1) uploadFiles.value[idx].processing = processing
  }

  async function handleImageResource(file, resourceType) {
    // add placeholder immediately so other flows see a file
    upsertEntry(resourceType, file, true)
    try {
      const compressed = await compressImage(file)
      upsertEntry(resourceType, compressed, false)
      return compressed
    } catch (error) {
      // keep original file but mark processing false and notify user
      markProcessing(resourceType, false)
      console.error('Error processing file:', error)
      Notify.create({
        type: 'negative',
        message: 'Error processing image. Using original file.',
        timeout: 5000
      })
      return file
    }
  }

  function handleUploadResource(file) {
    upsertEntry('upload', file)
    return file
  }

  async function handleFile(file, resourceType) {
    if (!file) return
    if (IMAGE_TYPES.has(resourceType)) return handleImageResource(file, resourceType)
    if (resourceType === 'upload') return handleUploadResource(file)
  }

  function ensureMetadata(video) {
    if (video.readyState >= 1) return Promise.resolve()
    return waitForVideoEvent(video, 'loadedmetadata')
  }

  // Extract a random frame from a video File and return an object URL
  async function getRandomFrameFromFile(file) {
    if (!file) return null
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const srcUrl = URL.createObjectURL(file)
    video.src = srcUrl
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    try {
      // Add timeout to prevent hanging on iOS
      const metadataPromise = ensureMetadata(video)
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Metadata loading timeout')), 10000)
      })

      await Promise.race([metadataPromise, timeoutPromise])

      // Additional iOS Safari compatibility check
      if (video.duration === 0 || !Number.isFinite(video.duration)) {
        throw new Error('Invalid video duration')
      }

      // attempt to autoplay then pause (iOS hack) - but only after metadata is loaded
      const playPromise = video.play()
      if (playPromise !== undefined) {
        try {
          await playPromise
          video.pause()
        } catch (e) {
          // ignore autoplay errors
          console.debug(e)
        }
      }

      // pick a random frame (avoid exact end) and wait for seek to complete
      const epsilon = 0.05
      const target = Math.max(
        0.01,
        Math.min(video.duration - epsilon, Math.random() * video.duration)
      )

      // Add timeout for seek operation
      const seekPromise = waitForSeek(video, target)
      const seekTimeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Seek operation timeout')), 5000)
      })

      await Promise.race([seekPromise, seekTimeoutPromise])

      // Ensure video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Invalid video dimensions')
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      const blob = await toBlobAsync(canvas, 'image/jpeg')
      const url = URL.createObjectURL(blob)
      return { url, blob }
    } finally {
      URL.revokeObjectURL(srcUrl)
    }
  }

  return {
    uploadFiles,
    handleFile,
    getRandomFrameFromFile
  }
}
