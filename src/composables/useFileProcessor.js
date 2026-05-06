import { ref } from 'vue'
import { Notify } from 'quasar'
import imageCompression from 'browser-image-compression'
import imageCompressionLibUrl from 'browser-image-compression/dist/browser-image-compression.js?url'

async function compressImage(file) {
  const options = {
    fileType: 'image/jpeg',
    maxWidthOrHeight: 720,
    useWebWorker: true,
    libURL: imageCompressionLibUrl
  }
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

function ensureMetadata(video) {
  if (video.readyState >= 1) return Promise.resolve()
  return waitForVideoEvent(video, 'loadedmetadata')
}

const LARGE_VIDEO_THRESHOLD_BYTES = 5 * 1024 * 1024 * 1024
const LARGE_VIDEO_EARLY_WINDOW_SECONDS = 600

function getExtractionTimeouts(file) {
  const fileSizeMb = Number.isFinite(file?.size) ? file.size / (1024 * 1024) : 0
  // Keep seek UX snappy (5s max); only metadata timeout scales for large files.
  const metadataTimeoutMs = Math.min(60000, Math.max(10000, 10000 + fileSizeMb * 20))
  const seekTimeoutMs = 5000
  return { metadataTimeoutMs, seekTimeoutMs }
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    })
  ])
}

function buildSeekTargets(file, duration, previousTime) {
  const epsilon = 0.05
  const isLargeVideo = Number.isFinite(file?.size) && file.size >= LARGE_VIDEO_THRESHOLD_BYTES

  const earlyDurationWindow = Math.max(
    0.5,
    Math.min(duration * 0.1, LARGE_VIDEO_EARLY_WINDOW_SECONDS)
  )
  const seekRange = isLargeVideo ? earlyDurationWindow : duration
  const maxPreviousRange = isLargeVideo ? seekRange : duration
  const randomTarget = Math.max(0.01, Math.min(duration - epsilon, Math.random() * seekRange))

  // Retry targets favor nearby/early areas where keyframe decode is often faster.
  const fallbackNearPrevious = Number.isFinite(previousTime)
    ? Math.max(0.01, Math.min(duration - epsilon, previousTime + 0.25, maxPreviousRange))
    : null
  const fallbackEarly = Math.max(0.01, Math.min(duration - epsilon, earlyDurationWindow))

  return [randomTarget, fallbackNearPrevious, fallbackEarly].filter(t => Number.isFinite(t))
}

let frameSession = null

function disposeFrameSession() {
  if (!frameSession) return
  try {
    frameSession.video.pause()
    frameSession.video.removeAttribute('src')
    frameSession.video.load()
  } catch (e) {
    console.debug(e)
  }
  if (frameSession.srcUrl) {
    URL.revokeObjectURL(frameSession.srcUrl)
  }
  frameSession = null
}

function ensureFrameSession(file) {
  if (frameSession && frameSession.file === file) {
    return frameSession
  }

  disposeFrameSession()

  const video = document.createElement('video')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const srcUrl = URL.createObjectURL(file)

  video.src = srcUrl
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'

  frameSession = {
    file,
    video,
    canvas,
    ctx,
    srcUrl,
    metadataPromise: ensureMetadata(video),
    lastSeekTime: null
  }

  return frameSession
}

// Extract a random frame from a video File and return an object URL
async function getRandomFrameFromFile(file) {
  if (!file) return null

  const session = ensureFrameSession(file)
  const { video, canvas, ctx, metadataPromise } = session
  const { metadataTimeoutMs, seekTimeoutMs } = getExtractionTimeouts(file)

  await withTimeout(metadataPromise, metadataTimeoutMs, 'Metadata loading timeout')

  // Additional iOS Safari compatibility check
  if (video.duration === 0 || !Number.isFinite(video.duration)) {
    throw new Error('Invalid video duration')
  }

  const seekTargets = buildSeekTargets(file, video.duration, session.lastSeekTime)
  let seekError = null
  for (const target of seekTargets) {
    try {
      await withTimeout(waitForSeek(video, target), seekTimeoutMs, 'Seek operation timeout')
      session.lastSeekTime = target
      seekError = null
      break
    } catch (error) {
      seekError = error
    }
  }
  if (seekError) {
    throw seekError
  }

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
}

export function useFileProcessor() {
  const uploadFiles = ref([])
  const latestTokenByResource = new Map()

  const IMAGE_TYPES = new Set(['cover', 'poster', 'preview'])

  function beginResourceProcessing(resourceType) {
    const token = (latestTokenByResource.get(resourceType) || 0) + 1
    latestTokenByResource.set(resourceType, token)
    return token
  }

  function isLatestResourceProcessing(resourceType, token) {
    return latestTokenByResource.get(resourceType) === token
  }

  function findIndex(resourceType) {
    return uploadFiles.value.findIndex(r => r.resourceType === resourceType)
  }

  function upsertEntry(resourceType, file, processing) {
    const idx = findIndex(resourceType)
    const entry =
      processing === undefined ? { resourceType, file } : { resourceType, file, processing }
    if (idx === -1) uploadFiles.value.push(entry)
    else uploadFiles.value[idx] = { ...uploadFiles.value[idx], ...entry }
  }

  function markProcessing(resourceType, processing) {
    const idx = findIndex(resourceType)
    if (idx !== -1) uploadFiles.value[idx].processing = processing
  }

  async function handleImageResource(file, resourceType) {
    const token = beginResourceProcessing(resourceType)
    // add placeholder immediately so other flows see a file
    upsertEntry(resourceType, file, true)
    try {
      const compressed = await compressImage(file)
      if (!isLatestResourceProcessing(resourceType, token)) {
        return file
      }
      // browser-image-compression may return a Blob (not File) when converting
      // file types (e.g. PNG→JPEG). Wrap it so prop validators see a File.
      const compressedFile =
        compressed instanceof File
          ? compressed
          : new File([compressed], file.name, {
            type: compressed.type || 'image/jpeg',
            lastModified: file.lastModified ?? Date.now()
          })
      upsertEntry(resourceType, compressedFile, false)
      return compressedFile
    } catch (error) {
      if (!isLatestResourceProcessing(resourceType, token)) {
        return file
      }
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

  return {
    uploadFiles,
    handleFile,
    getRandomFrameFromFile,
    disposeFrameSession
  }
}
