const GLOBAL_API_ERROR_CODES = new Set([
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'unprocessable_entity',
  'internal_server_error'
])

const DEFAULT_GLOBAL_API_ERROR_MESSAGES = {
  bad_request: 'Bad request.',
  unauthorized: 'Unauthorised. Please login.',
  forbidden: 'Forbidden.',
  not_found: 'Not found.',
  conflict: 'Conflict.',
  unprocessable_entity: 'Unprocessable entity.',
  internal_server_error: 'Internal server error.'
}

/**
 * @typedef {import('src/types/api-contract').ApiContracts['BadRequestErrorResponse'] |
 * import('src/types/api-contract').ApiContracts['UnauthorizedErrorResponse'] |
 * import('src/types/api-contract').ApiContracts['ForbiddenErrorResponse'] |
 * import('src/types/api-contract').ApiContracts['NotFoundErrorResponse'] |
 * import('src/types/api-contract').ApiContracts['ConflictErrorResponse'] |
 * import('src/types/api-contract').ApiContracts['UnprocessableEntityErrorResponse'] |
 * import('src/types/api-contract').ApiContracts['InternalServerErrorResponse']} GlobalApiErrorResponse
 */

/** @typedef {GlobalApiErrorResponse['error']} GlobalApiErrorCode */

/**
 * @typedef {import('src/types/api-contract').ApiContracts['ErrorDetailResponse'] |
 * import('src/types/api-contract').ApiContracts['ErrorResponse']} ComponentApiErrorResponse
 */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {unknown} error
 * @returns {Record<string, any> | null}
 */
export function getCloudflareGatewayErrorPayload(error) {
  const data = error?.response?.data
  if (!isPlainObject(data)) {
    return null
  }

  if (data.cloudflare_error !== true) {
    return null
  }

  if (typeof data.status !== 'number' || data.status < 500) {
    return null
  }

  if (typeof data.error_name !== 'string' || !data.error_name.trim()) {
    return null
  }

  return /** @type {Record<string, any>} */ (data)
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isGloballyHandledApiError(error) {
  if (error?.__cloudflareDialogShown === true) {
    return true
  }
  return getCloudflareGatewayErrorPayload(error) != null
}

/**
 * @param {Record<string, any>} payload
 * @returns {{ message: string, caption: string }}
 */
export function formatCloudflareGatewayError(payload) {
  let message = 'Temporary upstream error. Please retry in a moment.'
  if (typeof payload.what_you_should_do === 'string' && payload.what_you_should_do.trim()) {
    message = payload.what_you_should_do.trim().replaceAll('**', '')
  } else if (typeof payload.detail === 'string' && payload.detail.trim()) {
    message = payload.detail.trim()
  }

  const detailParts = []
  if (payload.error_name) {
    detailParts.push(`Type: ${payload.error_name}`)
  }
  if (payload.ray_id) {
    detailParts.push(`Ray ID: ${payload.ray_id}`)
  }
  if (Number.isFinite(Number(payload.retry_after))) {
    detailParts.push(`Retry after: ${Number(payload.retry_after)}s`)
  }

  return {
    message,
    caption: detailParts.join(' | ')
  }
}

/**
 * @param {unknown} error
 * @returns {GlobalApiErrorResponse | null}
 */
export function getGlobalApiErrorPayload(error) {
  const data = error?.response?.data
  if (!isPlainObject(data)) {
    return null
  }

  if (typeof data.status !== 'number' || typeof data.error !== 'string') {
    return null
  }

  if (!GLOBAL_API_ERROR_CODES.has(data.error)) {
    return null
  }

  if (data.message != null && typeof data.message !== 'string') {
    return null
  }

  return /** @type {GlobalApiErrorResponse} */ (data)
}

/**
 * @param {unknown} error
 * @returns {ComponentApiErrorResponse | null}
 */
export function getComponentApiErrorPayload(error) {
  const data = error?.response?.data
  if (!isPlainObject(data) || typeof data.error !== 'string') {
    return null
  }

  if (Array.isArray(data.detail) && data.error === 'Invalid upload request') {
    return /** @type {import('src/types/api-contract').ApiContracts['UploadValidationErrorResponse']} */ (
      data
    )
  }

  if (typeof data.detail === 'string' && data.error === 'Upload not complete') {
    return /** @type {import('src/types/api-contract').ApiContracts['UploadStorageConflictResponse']} */ (
      data
    )
  }

  if (data.detail == null && !('status' in data)) {
    return /** @type {import('src/types/api-contract').ApiContracts['DeletionBlockedResponse']} */ (
      data
    )
  }

  return null
}

function getUploadValidationMessage(payload) {
  const [firstDetail] = payload.detail || []
  if (typeof firstDetail?.msg === 'string' && firstDetail.msg) {
    return firstDetail.msg
  }

  return 'Invalid upload request.'
}

/**
 * @param {unknown} error
 * @param {GlobalApiErrorCode} code
 * @returns {boolean}
 */
export function isGlobalApiError(error, code) {
  return getGlobalApiErrorPayload(error)?.error === code
}

/**
 * @param {unknown} error
 * @param {string} [fallback='Something went wrong!']
 * @returns {string}
 */
export function getGlobalApiErrorMessage(error, fallback = 'Something went wrong!') {
  const payload = getGlobalApiErrorPayload(error)
  if (!payload) {
    return fallback
  }

  return payload.message || DEFAULT_GLOBAL_API_ERROR_MESSAGES[payload.error] || fallback
}

/**
 * @param {unknown} error
 * @param {string} [fallback='Something went wrong!']
 * @returns {string}
 */
export function getComponentApiErrorMessage(error, fallback = 'Something went wrong!') {
  if (isGloballyHandledApiError(error)) {
    return ''
  }

  const globalPayload = getGlobalApiErrorPayload(error)
  if (globalPayload) {
    return getGlobalApiErrorMessage(error, fallback)
  }

  const payload = getComponentApiErrorPayload(error)
  if (!payload) {
    return fallback
  }

  if (Array.isArray(payload.detail)) {
    return getUploadValidationMessage(payload)
  }

  if (typeof payload.detail === 'string' && payload.detail) {
    return payload.detail
  }

  return payload.error || fallback
}
