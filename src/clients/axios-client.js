import axios from 'axios'
import axiosRetry from 'axios-retry'
import { parseRetryAfterSeconds } from 'src/utils/api-error-rate-limit.js'

const shouldRetryApi = error => {
  const method = (error?.config?.method || '').toLowerCase()
  const isSafeMethod = ['get', 'head', 'options'].includes(method)
  const allowNonIdempotentRetry = error?.config?.__retryNonIdempotent === true

  if (!isSafeMethod && !allowNonIdempotentRetry) {
    return false
  }

  const status = error?.response?.status
  if (status == null) {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
  }
  return ![400, 401, 402, 403, 404, 409, 500, 501].includes(status)
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

let interceptorsInstalled = false

const installApiClientInterceptors = ({
  getCsrfToken,
  onBeforeDelete,
  onRequestStart,
  onRequestEnd,
  onApiError
} = {}) => {
  if (interceptorsInstalled) return
  interceptorsInstalled = true

  api.interceptors.request.use(async req => {
    const method = (req.method || '').toLowerCase()

    if (['post', 'put', 'delete'].includes(method) && typeof getCsrfToken === 'function') {
      const token = getCsrfToken()
      if (token) {
        req.headers = req.headers || {}
        req.headers['X-CSRFToken'] = token
      }
    }

    if (method === 'delete' && typeof onBeforeDelete === 'function') {
      const confirmed = await onBeforeDelete(req)
      if (!confirmed) {
        const err = new Error('User cancelled delete')
        err.__userCancelled = true
        err.code = 'ERR_CANCELED'
        throw err
      }
    }

    if (typeof onRequestStart === 'function') {
      onRequestStart(req)
    }

    return req
  })

  api.interceptors.response.use(
    response => {
      try {
        const responseGuard = response?.config?.__responseGuard
        if (typeof responseGuard === 'function') {
          responseGuard(response.data)
        }
        return response
      } catch (error) {
        const validationError = new Error(
          error?.message || 'Invalid API response received from server.'
        )
        validationError.code = 'ERR_INVALID_RESPONSE'
        validationError.__invalidApiResponse = true
        validationError.__cause = error
        validationError.config = response?.config
        validationError.response = response

        if (typeof onApiError === 'function') {
          onApiError({
            error: validationError,
            status: response?.status,
            requestCanceled: false
          })
          validationError.__apiErrorHandled = true
        }

        return Promise.reject(validationError)
      } finally {
        if (typeof onRequestEnd === 'function') {
          onRequestEnd(response?.config)
        }
      }
    },
    error => {
      if (typeof onRequestEnd === 'function') {
        onRequestEnd(error?.config)
      }

      const status = error?.response?.status
      const requestCanceled =
        error?.__userCancelled === true ||
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError'

      if (typeof onApiError === 'function' && error?.__apiErrorHandled !== true) {
        onApiError({
          error,
          status,
          requestCanceled
        })
      }

      return Promise.reject(error)
    }
  )
}

export { api, installApiClientInterceptors }
