import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'

/** Minimum file size (bytes) for multipart upload. Only applies to `upload` resource type. */
const MULTIPART_THRESHOLD = 100 * 1024 * 1024 // 100 MB

/**
 * Extend multipart retries beyond Uppy defaults so brief backend restarts
 * (signing endpoints) do not fail active uploads.
 */
const MULTIPART_RETRY_DELAYS_MS = [0, 1000, 2000, 4000, 8000, 16000, 32000]

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

/**
 * Create a configured Uppy client that handles both single-part (images) and
 * multipart (large video files) uploads.
 *
 * - Images (cover, poster, preview): single-part presigned PUT via backend `/upload/s3/params`.
 * - Videos (`upload` resource type, ≥ MULTIPART_THRESHOLD): multipart via backend
 *   companion-compatible `/upload/s3/multipart/*` endpoints.
 * - Videos below the threshold: single-part PUT via the same `/upload/s3/params` endpoint.
 *
 * @param {{
 *   id?: string,
 *   instructions: Array<{ resourceType: string, url: string, reference?: number }>,
 *   maxFileSize?: number,
 *   uploadEndpoint?: string,
 *   headers?: Record<string, string>,
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
  uploadEndpoint = '/api/upload',
  headers = {},
  onTotalProgress,
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
  const companionBase = uploadEndpoint.replace(/\/$/, '')

  uppy.use(AwsS3, {
    endpoint: uploadEndpoint,
    headers,
    retryDelays: MULTIPART_RETRY_DELAYS_MS,
    shouldUseMultipart: file =>
      file.meta?.resourceType === 'upload' && file.size >= MULTIPART_THRESHOLD,
    async createMultipartUpload(file) {
      const response = await fetch(`${companionBase}/s3/multipart`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          filename: file?.name || 'upload.bin',
          type: file?.type || 'application/octet-stream',
          resourceType: file?.meta?.resourceType,
          reference: file?.meta?.reference ?? null
        })
      })

      if (!response.ok) {
        throw new Error(`Multipart create failed (${response.status})`)
      }

      return response.json()
    },
    async getUploadParameters(file) {
      const instruction = instructionByType.get(file.meta?.resourceType)
      if (!instruction?.url) {
        const resourceType =
          typeof file.meta?.resourceType === 'string' ? file.meta.resourceType : 'unknown resource'
        throw new Error(`Missing upload URL for ${resourceType}`)
      }

      return {
        method: 'PUT',
        url: instruction.url,
        fields: {},
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      }
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
      if (!instruction?.reference) {
        throw new Error(`Missing upload instruction for ${resourceType}`)
      }

      return uppy.addFile({
        source,
        name: file?.name || `${resourceType}.bin`,
        type: file?.type || 'application/octet-stream',
        data: file,
        meta: { resourceType, reference: instruction?.reference ?? null }
      })
    },
    upload() {
      return uppy.upload()
    },
    destroy() {
      destroyUppy(uppy)
    }
  }
}
