import axios from 'axios'
import axiosRetry from 'axios-retry'
import { parseRetryAfterSeconds } from 'src/utils/api-error-service.js'

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

const shouldRetryApi = error => {
  const method = (error?.config?.method || '').toLowerCase()
  const isSafeMethod = ['get', 'head', 'options'].includes(method)

  if (!isSafeMethod) {
    return false
  }

  const status = error?.response?.status
  if (status == null) {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
  }
  return RETRYABLE_STATUS_CODES.has(status)
}

const retryDelay = (retryCount, error) => {
  if (error?.response?.status === 429) {
    const retryAfter = parseRetryAfterSeconds(error?.response?.headers?.['retry-after'])
    if (retryAfter != null) {
      return retryAfter * 1000
    }
  }
  return axiosRetry.exponentialDelay(retryCount, error)
}

const api = axios.create({
  baseURL: process.env.API,
  withCredentials: true
})

axiosRetry(api, {
  retries: 6,
  retryDelay,
  retryCondition: shouldRetryApi
})

export { api }
