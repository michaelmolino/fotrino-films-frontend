import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'

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
        const failedNames = result.failed.map(file => file.name).join(', ')
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

/**
 * Create a configured Uppy client for presigned PUT uploads.
 *
 * @param {{
 *   id?: string,
 *   instructions: Array<{ resourceType: string, url: string, reference?: number }>,
 *   maxFileSize?: number,
 *   onProgress?: (progressData: any) => void,
 *   onUploadSuccess?: (file: any, instruction: any) => void,
 *   onUploadError?: (file: any, error: Error) => void,
 * }} options
 */
export function createPresignedUppyClient({
    id = 'presigned-uploader',
    instructions = [],
    maxFileSize = 5368709120,
    onProgress,
    onUploadSuccess,
    onUploadError
}) {
    const instructionByType = buildInstructionMap(instructions)

    const uppy = new Uppy({
        id,
        autoProceed: false,
        allowMultipleUploads: true,
        restrictions: {
            maxFileSize
        }
    })

    uppy.use(XHRUpload, {
        method: 'PUT',
        formData: false,
        bundle: false,
        endpoint: file => {
            const instruction = instructionByType.get(file.meta?.resourceType)
            if (!instruction) {
                throw new Error(`No upload instruction found for ${file.meta?.resourceType}`)
            }
            return instruction.url
        },
        headers: file => ({
            'Content-Type': file.type || 'application/octet-stream'
        }),
        getResponseData: () => ({ url: null })
    })

    if (onProgress) {
        uppy.on('progress', onProgress)
    }

    if (onUploadSuccess) {
        uppy.on('upload-success', file => {
            const instruction = instructionByType.get(file.meta?.resourceType) || null
            onUploadSuccess(file, instruction)
        })
    }

    if (onUploadError) {
        uppy.on('upload-error', (file, error) => onUploadError(file, error))
    }

    return {
        uppy,
        addFile({ file, resourceType, source = 'presigned-upload' }) {
            return uppy.addFile({
                source,
                name: file?.name || `${resourceType}.bin`,
                type: file?.type || 'application/octet-stream',
                data: file,
                meta: { resourceType }
            })
        },
        async uploadAndAssert(requiredResourceTypes = []) {
            const result = await uppy.upload()
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
