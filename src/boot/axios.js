import { boot } from 'quasar/wrappers'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { Notify } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { useRequestLoading } from 'src/composables/useRequestLoading'
import {
  getGlobalApiErrorMessage,
  getGlobalApiErrorPayload,
  isGlobalApiError
} from 'src/utils/api-errors.js'

const shouldRetryApi = error => {
  const status = error?.response?.status
  if (status == null) {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
  }
  return ![400, 401, 402, 403, 404, 409, 500, 501].includes(status)
}

const api = axios.create({ baseURL: process.env.API })

axiosRetry(api, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: shouldRetryApi
})

export default boot(({ app, router }) => {
  const { increment: showLoader, decrement: hideLoader } = useRequestLoading()

  api.interceptors.request.use(req => {
    const method = (req.method || '').toLowerCase()

    // Attach CSRF only when available and required
    if (['post', 'put', 'delete'].includes(method)) {
      const token = useAccountStore()?.profile?.csrfToken
      if (token) {
        req.headers['X-CSRFToken'] = token
      }
    }

    // Confirm destructive action
    if (method === 'delete') {
      return new Promise((resolve, reject) => {
        Notify.create({
          type: 'negative',
          timeout: 0,
          message: 'This is a destructive action. Are you sure you want to continue?',
          position: 'center',
          icon: 'info',
          multiLine: true,
          actions: [
            {
              icon: 'error',
              label: 'Confirm delete',
              color: 'white',
              'data-cy': 'confirm-delete',
              handler: () => {
                showLoader()
                resolve(req)
              }
            },
            {
              icon: 'undo',
              label: 'Go Back',
              color: 'white',
              'data-cy': 'cancel-delete',
              handler: () => {
                const err = new Error('User cancelled delete')
                err.__userCancelled = true
                err.code = 'ERR_CANCELED'
                reject(err)
              }
            }
          ]
        })
      })
    }

    showLoader()
    return req
  })

  api.interceptors.response.use(
    response => {
      hideLoader()
      return response
    },
    error => {
      hideLoader()

      const apiError = getGlobalApiErrorPayload(error)
      const status = apiError?.status ?? error?.response?.status
      const skipNotify = error?.config?.__skipGlobalErrorNotify === true

      if (isGlobalApiError(error, 'not_found')) {
        router.replace('/404')
        return Promise.reject(error)
      }

      let msg = getGlobalApiErrorMessage(error)
      if (!apiError && status === 402) msg = 'You have exceeded a limit for your account type.'
      else if (!apiError && status === 501) msg = 'Not yet implemented.'

      let timeout = 0
      if (error.code === 'ERR_CANCELED') {
        msg = 'Request cancelled.'
        timeout = 3000
      }

      if (!skipNotify) {
        Notify.create({
          type: 'negative',
          timeout: timeout,
          message: msg,
          icon: 'warning',
          actions: timeout === 0 ? [{ label: 'Dismiss', color: 'white' }] : []
        })
      }

      if (
        isGlobalApiError(error, 'unauthorized') ||
        isGlobalApiError(error, 'forbidden') ||
        status === 401 ||
        status === 403
      ) {
        router.replace('/')
      }

      return Promise.reject(error)
    }
  )

  app.config.globalProperties.$api = api
})

export { api }
