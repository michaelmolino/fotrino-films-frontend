import axios from 'axios'
import axiosRetry from 'axios-retry'
import { parseRetryAfterSeconds } from 'src/utils/api-error-rate-limit.js'

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

let interceptorsInstalled = false
const RESOLVED_REQUEST_POLICY_KEY = '__resolvedRequestPolicy'

const getRequestPolicyFromConfig = config => {
  return config?.[RESOLVED_REQUEST_POLICY_KEY]
}

const installApiClientInterceptors = ({
  resolveRequestPolicy,
  getCsrfToken,
  onBeforeDelete,
  onRequestStart,
  onRequestEnd,
  onApiError
}) => {
  // ensure interceptors are only installed once
  if (interceptorsInstalled) return
  interceptorsInstalled = true

  api.interceptors.request.use(async req => {
    const method = (req.method || '').toLowerCase()
    const requestPolicy = resolveRequestPolicy(req)

    req[RESOLVED_REQUEST_POLICY_KEY] = requestPolicy

    if (['post', 'put', 'delete'].includes(method)) {
      const csrfToken = getCsrfToken(req, requestPolicy)
      if (csrfToken != null) {
        req.headers = req.headers || {}
        req.headers['X-CSRFToken'] = csrfToken
      }
    }

    if (method === 'delete') {
      const confirmed = await onBeforeDelete(req, requestPolicy)
      if (!confirmed) {
        const err = new Error('User cancelled delete')
        err.__userCancelled = true
        err.code = 'ERR_CANCELED'
        throw err
      }
    }

    onRequestStart(req, requestPolicy)

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

        onApiError({
          error: validationError,
          status: response?.status,
          requestCanceled: false,
          requestPolicy: getRequestPolicyFromConfig(response?.config)
        })
        validationError.__apiErrorHandled = true

        return Promise.reject(validationError)
      } finally {
        onRequestEnd(response?.config, getRequestPolicyFromConfig(response?.config))
      }
    },
    error => {
      onRequestEnd(error?.config, getRequestPolicyFromConfig(error?.config))

      const status = error?.response?.status
      const requestCanceled =
        error?.__userCancelled === true ||
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError'

      if (error?.__apiErrorHandled !== true) {
        onApiError({
          error,
          status,
          requestCanceled,
          requestPolicy: getRequestPolicyFromConfig(error?.config)
        })
      }

      return Promise.reject(error)
    }
  )
}

export { api, installApiClientInterceptors }
