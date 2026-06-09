import { boot } from 'quasar/wrappers'
import { Dialog, Loading } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { api } from 'src/clients/axios-client.js'
import { confirmDestructiveAction, notifyError } from 'src/utils/notify.js'
import {
  getCloudflareGatewayErrorPayload,
  getComponentApiErrorPayload,
  getGlobalApiErrorPayload,
  getGlobalApiErrorMessage
} from 'src/utils/api-error-service.js'
import CloudflareGatewayErrorDialog from '@components/errors/CloudflareGatewayErrorDialog.vue'

const DEFAULT_REQUEST_POLICY = Object.freeze({
  csrfHandling: 'global',
  deleteHandling: 'global',
  notFoundHandling: 'none',
  errorHandling: 'global',
  loadHandling: 'global'
})

const RESOLVED_REQUEST_POLICY_KEY = '__resolvedRequestPolicy'
const CSRF_RETRY_MARKER_KEY = '__csrfRetryAttempted'

let interceptorsInstalled = false
let csrfRefreshPromise = null

function resolveRequestPolicy(config) {
  const policy = config?.__policy && typeof config.__policy === 'object' ? config.__policy : null
  return {
    csrfHandling: policy?.csrfHandling ?? DEFAULT_REQUEST_POLICY.csrfHandling,
    deleteHandling: policy?.deleteHandling ?? DEFAULT_REQUEST_POLICY.deleteHandling,
    notFoundHandling: policy?.notFoundHandling ?? DEFAULT_REQUEST_POLICY.notFoundHandling,
    loadHandling: policy?.loadHandling ?? DEFAULT_REQUEST_POLICY.loadHandling,
    errorHandling: policy?.errorHandling ?? DEFAULT_REQUEST_POLICY.errorHandling
  }
}

export default boot(({ app, router }) => {
  if (interceptorsInstalled) {
    app.config.globalProperties.$api = api
    return
  }
  interceptorsInstalled = true

  let loadingRequestCount = 0

  const showLoader = () => {
    if (loadingRequestCount === 0) {
      Loading.show()
    }
    loadingRequestCount++
  }

  const hideLoader = () => {
    loadingRequestCount = Math.max(0, loadingRequestCount - 1)
    if (loadingRequestCount === 0) {
      Loading.hide()
    }
  }

  const isMutationMethod = method => {
    return ['post', 'put', 'delete'].includes(method)
  }

  const attachCsrfToken = req => {
    const method = (req.method || '').toLowerCase()
    const requestPolicy = req?.[RESOLVED_REQUEST_POLICY_KEY]

    if (!isMutationMethod(method)) {
      return
    }

    if (requestPolicy.csrfHandling !== 'global') {
      return
    }

    const csrfToken = useAccountStore()?.profile?.csrfToken
    if (csrfToken == null) {
      return
    }

    req.headers = req.headers || {}
    req.headers['X-CSRFToken'] = csrfToken
  }

  const confirmDeleteRequest = async req => {
    const method = (req.method || '').toLowerCase()
    const requestPolicy = req?.[RESOLVED_REQUEST_POLICY_KEY]

    if (req?.__skipDeleteConfirm === true) {
      return true
    }

    if (method !== 'delete' || requestPolicy.deleteHandling !== 'global') {
      return true
    }

    return await confirmDestructiveAction({
      confirmAction: { 'data-cy': 'confirm-delete' },
      cancelAction: { 'data-cy': 'cancel-delete' }
    })
  }

  const handleApiError = ({ error, status, requestCanceled, requestPolicy }) => {
    const globalPayload = getGlobalApiErrorPayload(error)
    const cloudflarePayload = getCloudflareGatewayErrorPayload(error)
    const resolvedStatus = globalPayload?.status ?? error?.response?.status ?? status
    const code = globalPayload?.error
    const isRequestCanceled =
      requestCanceled === true ||
      error?.__userCancelled === true ||
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError'
    const isUnauthorized =
      code === 'unauthorized' ||
      code === 'forbidden' ||
      resolvedStatus === 401 ||
      resolvedStatus === 403
    const isNotFound = code === 'not_found' || resolvedStatus === 404
    const componentErrorPayload = getComponentApiErrorPayload(error)
    const skipNotify = requestPolicy?.errorHandling !== 'global' || componentErrorPayload != null

    if (isRequestCanceled) {
      return
    }

    if (cloudflarePayload) {
      Dialog.create({
        component: CloudflareGatewayErrorDialog,
        componentProps: {
          payload: cloudflarePayload,
          requestMethod: error?.config?.method,
          requestUrl: error?.config?.url,
          requestStatus: resolvedStatus
        }
      })
      error.__cloudflareDialogShown = true
      error.__globalErrorHandled = true
    }

    if (isUnauthorized) {
      error.__globalErrorHandled = true
      router.replace('/')
      return
    }

    if (isNotFound && requestPolicy?.notFoundHandling !== 'none') {
      error.__globalErrorHandled = true
      router.replace('/404')
      return
    }

    if (!skipNotify && !cloudflarePayload) {
      error.__globalErrorHandled = true
      notifyError(getGlobalApiErrorMessage(error), { timeout: 0 })
    }
  }

  const shouldRetryForExpiredCsrf = ({ error, status, requestPolicy }) => {
    const method = error?.config?.method
    const errorCode = getGlobalApiErrorPayload(error)?.error

    if (!isMutationMethod(method)) {
      return false
    }

    if (requestPolicy?.csrfHandling !== 'global') {
      return false
    }

    if (error?.config?.[CSRF_RETRY_MARKER_KEY] === true) {
      return false
    }

    return status === 400 && errorCode === 'csrf_invalid'
  }

  const refreshProfileForCsrfRetry = async () => {
    if (!csrfRefreshPromise) {
      csrfRefreshPromise = useAccountStore()
        .fetchProfile()
        .finally(() => {
          csrfRefreshPromise = null
        })
    }

    return await csrfRefreshPromise
  }

  const retryRequestWithFreshCsrf = async error => {
    const originalConfig = error?.config
    if (!originalConfig) {
      return null
    }

    const refreshedProfile = await refreshProfileForCsrfRetry()
    if (!refreshedProfile?.csrfToken) {
      return null
    }

    const retryConfig = {
      ...originalConfig,
      __skipDeleteConfirm: true,
      [CSRF_RETRY_MARKER_KEY]: true
    }

    delete retryConfig[RESOLVED_REQUEST_POLICY_KEY]

    return await api.request(retryConfig)
  }

  const onRequest = async req => {
    const requestPolicy = (req[RESOLVED_REQUEST_POLICY_KEY] = resolveRequestPolicy(req))

    attachCsrfToken(req)

    const confirmed = await confirmDeleteRequest(req)
    if (!confirmed) {
      const err = new Error('User cancelled delete')
      err.__userCancelled = true
      err.code = 'ERR_CANCELED'
      throw err
    }

    if (requestPolicy.loadHandling === 'global') {
      showLoader()
    }

    return req
  }

  const onResponseSuccess = response => {
    const requestPolicy = response?.config?.[RESOLVED_REQUEST_POLICY_KEY]
    if (requestPolicy?.loadHandling === 'global') {
      hideLoader()
    }
    return response
  }

  const onResponseError = async error => {
    const requestPolicy = error?.config?.[RESOLVED_REQUEST_POLICY_KEY]
    if (requestPolicy?.loadHandling === 'global') {
      hideLoader()
    }

    const status = error?.response?.status
    const requestCanceled =
      error?.__userCancelled === true ||
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError'

    if (shouldRetryForExpiredCsrf({ error, status, requestPolicy })) {
      const retriedResponse = await retryRequestWithFreshCsrf(error)
      if (retriedResponse) {
        return retriedResponse
      }
    }

    if (error?.__apiErrorHandled !== true) {
      handleApiError({
        error,
        status,
        requestCanceled,
        requestPolicy
      })
    }

    throw error
  }

  api.interceptors.request.use(onRequest)

  api.interceptors.response.use(onResponseSuccess, onResponseError)

  app.config.globalProperties.$api = api
})
