import axios from 'axios'
import axiosRetry from 'axios-retry'

const shouldRetryApi = error => {
  const status = error?.response?.status
  if (status == null) {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
  }
  return ![400, 401, 402, 403, 404, 409, 500, 501].includes(status)
}

const retryDelay = (retryCount, error) => {
  if (error?.response?.status === 429) {
    const retryAfter = error.response.headers?.['retry-after']
    if (retryAfter) {
      const seconds = Number.parseFloat(retryAfter)
      if (!Number.isNaN(seconds) && seconds > 0) {
        return seconds * 1000
      }
    }
    return Math.pow(2, retryCount) * 1000
  }
  return axiosRetry.exponentialDelay(retryCount, error)
}

const api = axios.create({ baseURL: process.env.API })

axiosRetry(api, {
  retries: 6,
  retryDelay,
  retryCondition: shouldRetryApi
})

export { api }