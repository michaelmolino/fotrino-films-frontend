import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'
import {
    createMultipartCompanionApi,
    getMultipartMediaId
} from './uppy-upload-multipart.js'
import { uploadAndAssert } from './uppy-upload-policy.js'

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

function getInstructionOrThrow(instructionByType, resourceType) {
    const instruction = instructionByType.get(resourceType)
    if (!instruction) {
        throw new Error(`No upload instruction found for ${resourceType}`)
    }
    return instruction
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
 *   onTotalProgress?: (percent: number) => void,
 *   onProgress?: (progressData: any) => void,
 *   onUploadSuccess?: (file: any, instruction: any) => void,
 *   onUploadError?: (file: any, error: Error) => void,
 * }} options
 */
export function createPresignedUppyClient({
    id = 'presigned-uploader',
    instructions = [],
    maxFileSize = null,
    multipartBaseUrl = '/multipart/media',
    onTotalProgress,
    onProgress,
    onUploadSuccess,
    onUploadError
}) {
    const instructionByType = buildInstructionMap(instructions)
    const multipartApi = createMultipartCompanionApi({ multipartBaseUrl })

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
            return multipartApi.createMultipartUpload(mediaId)
        },

        async listParts(file, { uploadId }) {
            const mediaId = getMultipartMediaId(file)
            return multipartApi.listParts(mediaId, uploadId)
        },

        async signPart(file, { uploadId, partNumber }) {
            const mediaId = getMultipartMediaId(file)
            const response = await multipartApi.signPart(mediaId, uploadId, partNumber)
            const { url } = response
            return { url }
        },

        async completeMultipartUpload(file, { uploadId, parts }) {
            const mediaId = getMultipartMediaId(file)
            await multipartApi.completeMultipartUpload(mediaId, uploadId, parts)
            return {}
        },

        async abortMultipartUpload(file, { uploadId }) {
            const mediaId = getMultipartMediaId(file)
            // Best-effort; ignore errors so Uppy can clean up its own state.
            await multipartApi.abortMultipartUpload(mediaId, uploadId).catch(() => { })
        }
    })

    if (onProgress) {
        uppy.on('upload-progress', (file, progressData) => onProgress(file, progressData))
    }

    if (onTotalProgress) {
        uppy.on('progress', percent => onTotalProgress(percent))
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
            return uploadAndAssert(uppy, requiredResourceTypes)
        },
        destroy() {
            destroyUppy(uppy)
        }
    }
}

