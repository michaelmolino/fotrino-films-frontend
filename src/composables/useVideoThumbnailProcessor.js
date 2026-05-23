import { VideoThumbnailGenerator } from 'browser-video-thumbnail-generator'

const RANDOM_POSITION_PRECISION = 2
// For large files, seeking to a random position deep in the file can take
// a very long time because the browser must decode from the prior keyframe.
// Limit the seek range to stay near the beginning where keyframes are dense.
const LARGE_FILE_THRESHOLD_BYTES = 512 * 1024 * 1024 // 200 MB
const LARGE_FILE_MAX_POSITION = 5 // seek within first 5% only
// Hard timeout so the spinner can never block the UI indefinitely.
const THUMBNAIL_TIMEOUT_MS = 6000

let frameSession = null

function ensureFrameSession(file) {
    if (frameSession && frameSession.file === file) {
        return frameSession
    }

    disposeFrameSession()

    const fileUrl = URL.createObjectURL(file)
    const generator = new VideoThumbnailGenerator(fileUrl)

    frameSession = {
        file,
        fileUrl,
        generator
    }

    return frameSession
}

function getRandomFramePosition(fileSize) {
    const maxPosition =
        fileSize > LARGE_FILE_THRESHOLD_BYTES ? LARGE_FILE_MAX_POSITION : 100
    return Number((Math.random() * maxPosition).toFixed(RANDOM_POSITION_PRECISION))
}

function withTimeout(promise, ms) {
    let timer
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(
            () => reject(new Error('Frame extraction timed out')),
            ms
        )
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

async function generateThumbnailBlob(session) {
    const framePosition = getRandomFramePosition(session.file.size)
    const result = await withTimeout(
        session.generator.getThumbnail(framePosition),
        THUMBNAIL_TIMEOUT_MS
    )
    if (!result?.thumbnail) {
        throw new Error('No thumbnail generated')
    }
    return toBlobFromUrl(result.thumbnail)
}

async function toBlobFromUrl(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error('Failed to resolve thumbnail blob')
    }
    return response.blob()
}

function disposeFrameSession() {
    if (!frameSession) return
    try {
        frameSession.generator.revokeUrls()
    } catch (e) {
        console.debug(e)
    }
    URL.revokeObjectURL(frameSession.fileUrl)
    frameSession = null
}

async function getRandomFrameFromFile(file) {
    if (!file) return null

    const session = ensureFrameSession(file)
    const blob = await generateThumbnailBlob(session)
    const url = URL.createObjectURL(blob)
    return { url, blob }
}

export function useVideoThumbnailProcessor() {
    return {
        getRandomFrameFromFile,
        disposeFrameSession
    }
}
