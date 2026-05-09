import { VideoThumbnailGenerator } from 'browser-video-thumbnail-generator'

const RANDOM_POSITION_PRECISION = 2

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

function getRandomFramePosition() {
    return Number((Math.random() * 100).toFixed(RANDOM_POSITION_PRECISION))
}

async function generateThumbnailBlob(session) {
    const framePosition = getRandomFramePosition()
    const result = await session.generator.getThumbnail(framePosition)
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
