const GLOBAL_API_ERROR_CODES = new Set([
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'unprocessable_entity',
  'internal_server_error',
  'rate_limited'
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

import {
  getCloudflareGatewayErrorPayload,
  getComponentApiErrorPayload,
  getGlobalApiErrorPayload
} from 'src/utils/api-error-payloads.js'
import {
  getRateLimitMessage,
  getRateLimitRetryAfterSeconds
} from 'src/utils/api-error-rate-limit.js'

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

function getUploadValidationMessage(payload) {
  const [firstDetail] = payload.detail || []
  if (typeof firstDetail?.msg === 'string' && firstDetail.msg) {
    return firstDetail.msg
  }

  return 'Invalid upload request.'
}

export function normalizeApiError(error, options = {}) {
  const fallbackStatus = typeof options.status === 'number' ? options.status : null
  const fallbackRequestCanceled = options.requestCanceled === true
  const cloudflarePayload = getCloudflareGatewayErrorPayload(error)
  const globalPayload = getGlobalApiErrorPayload(error)
  const status = globalPayload?.status ?? error?.response?.status ?? fallbackStatus
  const code = globalPayload?.error
  const requestCanceled =
    fallbackRequestCanceled ||
    error?.__userCancelled === true ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError'
  const retryAfterSeconds = status === 429 ? getRateLimitRetryAfterSeconds(error) : null
  const knownCode = typeof code === 'string' && GLOBAL_API_ERROR_CODES.has(code)
  const isUnauthorized =
    code === 'unauthorized' || code === 'forbidden' || status === 401 || status === 403
  const isNotFound = code === 'not_found' || status === 404
  const isRateLimited = code === 'rate_limited' || status === 429
  const isCloudflareGateway = cloudflarePayload != null
  const isGloballyHandled =
    error?.__globalErrorHandled === true ||
    error?.__cloudflareDialogShown === true ||
    isCloudflareGateway
  const message =
    typeof globalPayload?.message === 'string' && globalPayload.message.trim()
      ? globalPayload.message
      : null

  return {
    status,
    code,
    message,
    detail: globalPayload?.detail,
    globalPayload,
    requestCanceled,
    retryAfterSeconds,
    isKnownGlobalCode: knownCode,
    isUnauthorized,
    isNotFound,
    isRateLimited,
    isCloudflareGateway,
    cloudflarePayload,
    isGloballyHandled
  }
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
  const context = normalizeApiError(error)

  if (context.isRateLimited) {
    return getRateLimitMessage(error)
  }

  const payload = context.globalPayload
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
  const context = normalizeApiError(error)

  if (context.isGloballyHandled) {
    return ''
  }

  if (context.isRateLimited) {
    return getRateLimitMessage(error)
  }

  const globalPayload = context.globalPayload
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
