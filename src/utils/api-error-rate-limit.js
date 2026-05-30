export function parseRetryAfterSeconds(retryAfterHeader) {
  if (retryAfterHeader == null) {
    return null
  }

  const retryAfterText = String(retryAfterHeader).trim()
  if (!retryAfterText) {
    return null
  }

  const numericSeconds = Number.parseFloat(retryAfterText)
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return Math.ceil(numericSeconds)
  }

  const retryAt = new Date(retryAfterText).getTime()
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
  if (retryAfterSeconds != null) {
    return `You are sending requests too quickly. Please wait ${retryAfterSeconds}s and try again.`
  }
  return 'You are sending requests too quickly. Please wait a moment and try again.'
}
