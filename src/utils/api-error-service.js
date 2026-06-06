const DEFAULT_GLOBAL_API_ERROR_MESSAGES = {
  bad_request: 'Bad request.',
  unauthorized: 'Unauthorised. Please login.',
  forbidden: 'Forbidden.',
  not_found: 'Not found.',
  conflict: 'Conflict.',
  unprocessable_entity: 'Unprocessable entity.',
  internal_server_error: 'Internal server error.'
}

function getErrorData(error) {
  const data = error?.response?.data
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null
}

function isRateLimitedError(error, globalPayload) {
  const status = globalPayload?.status ?? error?.response?.status
  return globalPayload?.error === 'rate_limited' || status === 429
}

function getUploadValidationMessage(payload) {
  return payload?.detail?.[0]?.msg || 'Invalid upload request.'
}

export function getCloudflareGatewayErrorPayload(error) {
  const data = getErrorData(error)
  return data?.cloudflare_error === true &&
    data?.status >= 500 &&
    typeof data?.error_name === 'string'
    ? data
    : null
}

export function getGlobalApiErrorPayload(error) {
  const data = getErrorData(error)
  return typeof data?.status === 'number' && typeof data?.error === 'string' ? data : null
}

export function getComponentApiErrorPayload(error) {
  const data = getErrorData(error)
  if (typeof data?.error !== 'string') {
    return null
  }

  if (Array.isArray(data.detail) && data.error === 'Invalid upload request') {
    return data
  }

  if (typeof data.detail === 'string' && data.error === 'Upload not complete') {
    return data
  }

  return data.detail == null && data.status == null ? data : null
}

export function parseRetryAfterSeconds(retryAfterHeader) {
  const retryAfterText = String(retryAfterHeader ?? '').trim()
  if (!retryAfterText) {
    return null
  }

  const numericSeconds = Number(retryAfterText)
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return Math.ceil(numericSeconds)
  }

  const retryAt = Date.parse(retryAfterText)
  if (!Number.isFinite(retryAt)) {
    return null
  }

  const secondsUntilRetry = Math.ceil((retryAt - Date.now()) / 1000)
  return secondsUntilRetry > 0 ? secondsUntilRetry : null
}

export function getRateLimitRetryAfterSeconds(error) {
  return parseRetryAfterSeconds(error?.response?.headers?.['retry-after'])
}

export function getRateLimitMessage(error) {
  const retryAfterSeconds = getRateLimitRetryAfterSeconds(error)
  if (retryAfterSeconds === null) {
    return 'You are sending requests too quickly. Please wait a moment and try again.'
  }

  return `You are sending requests too quickly. Please wait ${retryAfterSeconds}s and try again.`
}

export function getGlobalApiErrorMessage(error, fallback = 'Something went wrong!') {
  const globalPayload = getGlobalApiErrorPayload(error)
  return isRateLimitedError(error, globalPayload)
    ? getRateLimitMessage(error)
    : (typeof globalPayload.message === 'string' && globalPayload.message) ||
        DEFAULT_GLOBAL_API_ERROR_MESSAGES[globalPayload.error] ||
        fallback
}

export function getComponentApiErrorMessage(error, fallback = 'Something went wrong!') {
  if (
    error?.__globalErrorHandled === true ||
    error?.__cloudflareDialogShown === true ||
    getCloudflareGatewayErrorPayload(error)
  ) {
    return ''
  }

  const globalPayload = getGlobalApiErrorPayload(error)
  if (isRateLimitedError(error, globalPayload)) {
    return getRateLimitMessage(error)
  }

  if (globalPayload) {
    return (
      (typeof globalPayload.message === 'string' && globalPayload.message) ||
      DEFAULT_GLOBAL_API_ERROR_MESSAGES[globalPayload.error] ||
      fallback
    )
  }

  const componentPayload = getComponentApiErrorPayload(error)
  if (!componentPayload) {
    return fallback
  }

  if (Array.isArray(componentPayload.detail)) {
    return getUploadValidationMessage(componentPayload)
  }

  if (typeof componentPayload.detail === 'string' && componentPayload.detail) {
    return componentPayload.detail
  }

  return componentPayload.error || fallback
}
