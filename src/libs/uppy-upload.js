import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'

/** Minimum file size (bytes) for multipart upload. Only applies to `upload` resource type. */
const MULTIPART_THRESHOLD = 100 * 1024 * 1024 // 100 MB

export function destroyUppy(uppy) {
    if (!uppy) return
    if (typeof uppy.destroy === 'function') {
        uppy.destroy()
        return
    }
    if (typeof uppy.close === 'function') {
        uppy.close()
    }
}

function buildInstructionMap(instructions = []) {
    const map = new Map()
    instructions.forEach(instruction => {
        map.set(instruction.resourceType, instruction)
    })
    return map
}

function assertUploadResult(result, requiredResourceTypes = []) {
    if (result.failed?.length) {
        const failedNames = result.failed
            .map(file => {
                const message = file?.error?.message
                return message ? `${file.name} (${message})` : file.name
            })
            .join(', ')
        throw new Error(`Upload failed for: ${failedNames}`)
    }

    const successful = result.successful || []
    if (successful.length === 0) {
        throw new Error('Uploader reported zero successful uploads.')
    }

    if (requiredResourceTypes.length > 0) {
        const successfulTypes = new Set(successful.map(file => file.meta?.resourceType))
        const missingTypes = requiredResourceTypes.filter(type => !successfulTypes.has(type))
        if (missingTypes.length > 0) {
            throw new Error(`Missing successful uploads for: ${missingTypes.join(', ')}`)
        }
    }
}

function isEmptyUploadResult(result) {
    const successful = result?.successful || []
    const failed = result?.failed || []
    return successful.length === 0 && failed.length === 0
}

function getInstructionOrThrow(instructionByType, resourceType) {
    const instruction = instructionByType.get(resourceType)
    if (!instruction) {
        throw new Error(`No upload instruction found for ${resourceType}`)
    }
    return instruction
}

function getMultipartMediaId(file) {
    const mediaId = file.meta?.reference
    if (!mediaId) {
        throw new Error('Missing media reference for multipart upload')
    }
    return mediaId
}

function buildCsrfHeaders(getCsrfToken, extraHeaders = {}) {
    return {
        ...extraHeaders,
        'X-CSRFToken': getCsrfToken()
    }
}

async function requestMultipartJson(url, { method = 'GET', getCsrfToken, body, headers = {} } = {}) {
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: buildCsrfHeaders(getCsrfToken, headers),
        body
    })

    if (!response.ok) {
        throw new Error(`${method} ${url} failed: ${response.status}`)
    }

    if (response.status === 204) {
        return null
    }

    return response.json()
}

/**
 * Create a configured Uppy client that handles both single-part (images) and
 * multipart (large video files) uploads.
 *
 * - Images (cover, poster, preview): always single-part presigned PUT via XHRUpload.
 * - Videos (`upload` resource type, ≥ MULTIPART_THRESHOLD): multipart via AwsS3 plugin
 *   using the backend companion endpoints.
 * - Videos below the threshold: single-part presigned PUT via AwsS3 getUploadParameters.
 *
 * @param {{
 *   id?: string,
 *   instructions: Array<{ resourceType: string, url: string, reference?: number }>,
 *   maxFileSize?: number,
 *   multipartBaseUrl?: string,
 *   getCsrfToken?: () => string,
 *   onProgress?: (progressData: any) => void,
 *   onUploadSuccess?: (file: any, instruction: any) => void,
 *   onUploadError?: (file: any, error: Error) => void,
 * }} options
 */
export function createPresignedUppyClient({
    id = 'presigned-uploader',
    instructions = [],
    maxFileSize = null,
    multipartBaseUrl = '/api/channels/media',
    getCsrfToken = () => '',
    onProgress,
    onUploadSuccess,
    onUploadError
}) {
    const instructionByType = buildInstructionMap(instructions)

    const restrictions = {}
    if (Number.isFinite(maxFileSize) && maxFileSize > 0) {
        restrictions.maxFileSize = maxFileSize
    }

    const uppy = new Uppy({
        id,
        autoProceed: false,
        allowMultipleUploads: true,
        restrictions
    })

    // AwsS3 plugin handles the `upload` resource type (video files).
    // For files >= MULTIPART_THRESHOLD it uses multipart; below that it uses
    // getUploadParameters for a standard presigned PUT.
    uppy.use(AwsS3, {
        shouldUseMultipart: (file) =>
            file.meta?.resourceType === 'upload' && file.size >= MULTIPART_THRESHOLD,

        // Single-part fallback: images AND small videos use the presigned URL from instructions.
        async getUploadParameters(file) {
            const instruction = getInstructionOrThrow(instructionByType, file.meta?.resourceType)
            return {
                method: 'PUT',
                url: instruction.url,
                fields: {},
                headers: { 'Content-Type': file.type || 'application/octet-stream' }
            }
        },

        // Multipart companion methods — only called for the `upload` resource type
        // when the file is >= MULTIPART_THRESHOLD.

        async createMultipartUpload(file) {
            const mediaId = getMultipartMediaId(file)
            return requestMultipartJson(`${multipartBaseUrl}/${mediaId}/multipart`, {
                method: 'POST',
                getCsrfToken
            })
        },

        async listParts(file, { uploadId }) {
            const mediaId = getMultipartMediaId(file)
            return requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}`
            )
        },

        async signPart(file, { uploadId, partNumber }) {
            const mediaId = getMultipartMediaId(file)
            const response = await requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}/sign/${partNumber}`,
                { getCsrfToken }
            )
            const { url } = response
            return { url }
        },

        async completeMultipartUpload(file, { uploadId, parts }) {
            const mediaId = getMultipartMediaId(file)
            await requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}/complete`,
                {
                    method: 'POST',
                    getCsrfToken,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ parts })
                }
            )
            return {}
        },

        async abortMultipartUpload(file, { uploadId }) {
            const mediaId = getMultipartMediaId(file)
            // Best-effort; ignore errors so Uppy can clean up its own state.
            await requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}`,
                {
                    method: 'DELETE',
                    getCsrfToken
                }
            ).catch(() => { })
        }
    })

    if (onProgress) {
        uppy.on('upload-progress', (file, progressData) => onProgress(file, progressData))
    }

    if (onUploadSuccess) {
        uppy.on('upload-success', file => {
            const instruction = instructionByType.get(file.meta?.resourceType) || null
            onUploadSuccess(file, instruction)
        })
    }

    if (onUploadError) {
        uppy.on('upload-error', (file, error) => onUploadError(file, error))
        uppy.on('error', error => onUploadError(null, error))
    }

    return {
        uppy,
        addFile({ file, resourceType, source = 'presigned-upload' }) {
            const instruction = instructionByType.get(resourceType)
            return uppy.addFile({
                source,
                name: file?.name || `${resourceType}.bin`,
                type: file?.type || 'application/octet-stream',
                data: file,
                meta: { resourceType, reference: instruction?.reference ?? null }
            })
        },
        async uploadAndAssert(requiredResourceTypes = []) {
            let result = await uppy.upload()

            // Occasionally the first call can resolve before files transition
            // into a started upload state. Retry once, which mirrors the manual
            // "Retry Upload" behavior users reported as successful.
            if (isEmptyUploadResult(result)) {
                result = await uppy.upload()
            }

            assertUploadResult(result, requiredResourceTypes)
            return result
        },
        destroy() {
            destroyUppy(uppy)
        }
    }
}

/**
 * Upload a single file to a presigned URL using Uppy.
 *
 * @param {{ url: string, file: File | Blob, resourceType?: string }} payload
 * @returns {Promise<void>}
 */
export async function uploadPresignedFileWithUppy({ url, file, resourceType = 'upload' }) {
    const client = createPresignedUppyClient({
        id: `presigned-single-${resourceType}`,
        instructions: [{ resourceType, url }],
        maxFileSize: file?.size || 5368709120
    })

    try {
        client.addFile({
            file,
            resourceType,
            source: 'presigned-upload'
        })
        await client.uploadAndAssert([resourceType])
    } finally {
        client.destroy()
    }
}
