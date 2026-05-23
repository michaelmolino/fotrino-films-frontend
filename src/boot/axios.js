import { boot } from 'quasar/wrappers'
import { useAccountStore } from 'src/stores/account-store'
import { api } from 'src/libs/api-client.js'
import { useRequestLoading } from 'src/composables/useRequestLoading'
import { confirmDestructiveAction, notifyError } from 'src/utils/notify.js'
import {
  getGlobalApiErrorMessage,
  getGlobalApiErrorPayload,
  isGlobalApiError
} from 'src/utils/api-errors.js'

export default boot(({ app, router }) => {
  const { increment: showLoader, decrement: hideLoader } = useRequestLoading()

  api.interceptors.request.use(req => {
    const method = (req.method || '').toLowerCase()
    const skipLoader = req.__skipRequestLoading === true
    const skipDeleteConfirm = req.__skipDeleteConfirm === true

    // Attach CSRF only when available and required
    if (['post', 'put', 'delete'].includes(method)) {
      const token = useAccountStore()?.profile?.csrfToken
      if (token) {
        req.headers['X-CSRFToken'] = token
      }
    }

    // Confirm destructive action
    if (method === 'delete' && !skipDeleteConfirm) {
      return confirmDestructiveAction({
        confirmAction: { 'data-cy': 'confirm-delete' },
        cancelAction: { 'data-cy': 'cancel-delete' }
      }).then(confirmed => {
        if (!confirmed) {
          const err = new Error('User cancelled delete')
          err.__userCancelled = true
          err.code = 'ERR_CANCELED'
          throw err
        }

        if (!skipLoader) {
          showLoader()
        }
        return req
      })
    }

    if (!skipLoader) {
      showLoader()
    }
    return req
  })

  api.interceptors.response.use(
    response => {
      if (response?.config?.__skipRequestLoading !== true) {
        hideLoader()
      }
      return response
    },
    error => {
      if (error?.config?.__skipRequestLoading !== true) {
        hideLoader()
      }

      const apiError = getGlobalApiErrorPayload(error)
      const status = apiError?.status ?? error?.response?.status
      const requestCanceled = error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
      const skipNotify =
        error?.config?.__skipGlobalErrorNotify === true ||
        requestCanceled

      if (isGlobalApiError(error, 'not_found')) {
        router.replace('/404')
        return Promise.reject(error)
      }

      let msg = getGlobalApiErrorMessage(error)
      if (!apiError && status === 402) msg = 'You have exceeded a limit for your account type.'
      else if (!apiError && status === 501) msg = 'Not yet implemented.'

      if (!skipNotify) {
        notifyError(msg, { timeout: 0 })
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
