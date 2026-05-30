function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

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

  return data
}

export function isCloudflareGatewayError(error) {
  return getCloudflareGatewayErrorPayload(error) != null
}

export function getGlobalApiErrorPayload(error) {
  const data = error?.response?.data
  if (!isPlainObject(data)) {
    return null
  }

  if (typeof data.status !== 'number' || typeof data.error !== 'string') {
    return null
  }

  if (data.message != null && typeof data.message !== 'string') {
    return null
  }

  return data
}

export function getComponentApiErrorPayload(error) {
  const data = error?.response?.data
  if (!isPlainObject(data) || typeof data.error !== 'string') {
    return null
  }

  if (Array.isArray(data.detail) && data.error === 'Invalid upload request') {
    return data
  }

  if (typeof data.detail === 'string' && data.error === 'Upload not complete') {
    return data
  }

  if (data.detail == null && !('status' in data)) {
    return data
  }

  return null
}
