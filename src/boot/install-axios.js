import { boot } from 'quasar/wrappers'
import { Dialog } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { api, installApiClientInterceptors } from 'src/clients/axios-client.js'
import { useRequestLoading } from 'src/composables/useRequestLoading'
import { confirmDestructiveAction, notifyError } from 'src/utils/notify.js'
import {
  getCloudflareGatewayErrorPayload,
  getGlobalApiErrorPayload,
  getGlobalApiErrorMessage,
  isCloudflareGatewayError,
  isGlobalApiError
} from 'src/utils/apiErrors.js'
import CloudflareGatewayErrorDialog from '@components/errors/CloudflareGatewayErrorDialog.vue'

export default boot(({ app, router }) => {
  const { increment: showLoader, decrement: hideLoader } = useRequestLoading()

  installApiClientInterceptors({
    getCsrfToken: () => useAccountStore()?.profile?.csrfToken,
    onBeforeDelete: () => {
      return confirmDestructiveAction({
        confirmAction: { 'data-cy': 'confirm-delete' },
        cancelAction: { 'data-cy': 'cancel-delete' }
      })
    },
    onRequestStart: () => {
      showLoader()
    },
    onRequestEnd: () => {
      hideLoader()
    },
    onApiError: ({ error, status, requestCanceled }) => {
      const skipNotify = error?.config?.__skipGlobalErrorNotify === true || requestCanceled
      const cloudflareError = isCloudflareGatewayError(error)
      const cloudflarePayload = cloudflareError ? getCloudflareGatewayErrorPayload(error) : null
      const apiError = getGlobalApiErrorPayload(error)
      const resolvedStatus = apiError?.status ?? status

      if (cloudflareError && !requestCanceled) {
        Dialog.create({
          component: CloudflareGatewayErrorDialog,
          componentProps: {
            payload: cloudflarePayload,
            requestMethod: error?.config?.method,
            requestUrl: error?.config?.url,
            requestStatus: resolvedStatus ?? error?.response?.status
          }
        })
        error.__cloudflareDialogShown = true
      }

      if (isGlobalApiError(error, 'not_found') && error?.config?.__redirectNotFoundTo404 === true) {
        router.replace('/404')
        return
      }

      let msg = getGlobalApiErrorMessage(error)
      const timeout = 0

      if (!apiError && resolvedStatus === 402)
        msg = 'You have exceeded a limit for your account type.'
      else if (!apiError && resolvedStatus === 501) msg = 'Not yet implemented.'

      if (!skipNotify) {
        if (!cloudflareError) {
          notifyError(msg, {
            timeout,
            multiLine: true
          })
        }
      }

      if (
        isGlobalApiError(error, 'unauthorized') ||
        isGlobalApiError(error, 'forbidden') ||
        resolvedStatus === 401 ||
        resolvedStatus === 403
      ) {
        router.replace('/')
      }
    }
  })

  app.config.globalProperties.$api = api
})
