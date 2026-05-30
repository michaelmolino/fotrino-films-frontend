import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'

// Minimum size (bytes) to switch `upload` resources to multipart flow.
const MULTIPART_THRESHOLD = 100 * 1024 * 1024 // 100 MB

// Extend retries so brief backend restarts do not fail active multipart uploads.
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

// Create an Uppy client that uploads images with single-part PUT and switches
// `upload` resources to multipart only when size reaches MULTIPART_THRESHOLD.
export function createPresignedUppyClient({
  id = 'presigned-uploader',
  instructions = [],
  maxFileSize = null,
  uploadEndpoint = '/uppy',
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
