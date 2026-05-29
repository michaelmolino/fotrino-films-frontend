import { boot } from 'quasar/wrappers'
import { Dialog } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { api, installApiClientInterceptors } from 'src/clients/axios-client.js'
import { useRequestLoading } from 'src/composables/useRequestLoading'
import { confirmDestructiveAction, notifyError } from 'src/utils/notify.js'
import {
  REQUEST_POLICY_AUTH_REDIRECT,
  REQUEST_POLICY_LOADING,
  REQUEST_POLICY_NOTIFY,
  REQUEST_POLICY_NOT_FOUND,
  resolveRequestPolicy
} from 'src/utils/requestPolicy.js'
import {
  getGlobalApiErrorMessage,
  normalizeApiError
} from 'src/utils/api-error-service.js'
import { getComponentApiErrorPayload } from 'src/utils/api-error-payloads.js'
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
    onRequestStart: req => {
      const requestPolicy = resolveRequestPolicy(req)
      if (requestPolicy.loading !== REQUEST_POLICY_LOADING.GLOBAL) {
        return
      }
      showLoader()
    },
    onRequestEnd: req => {
      const requestPolicy = resolveRequestPolicy(req)
      if (requestPolicy.loading !== REQUEST_POLICY_LOADING.GLOBAL) {
        return
      }
      hideLoader()
    },
    onApiError: ({ error, status, requestCanceled }) => {
      const requestPolicy = resolveRequestPolicy(error?.config)
      const normalized = normalizeApiError(error, { status, requestCanceled })
      const componentErrorPayload = getComponentApiErrorPayload(error)
      const skipNotify =
        requestPolicy.notify !== REQUEST_POLICY_NOTIFY.GLOBAL ||
        normalized.requestCanceled ||
        componentErrorPayload != null
      const resolvedStatus = normalized.status

      if (normalized.requestCanceled) {
        return
      }

      if (normalized.isCloudflareGateway) {
        Dialog.create({
          component: CloudflareGatewayErrorDialog,
          componentProps: {
            payload: normalized.cloudflarePayload,
            requestMethod: error?.config?.method,
            requestUrl: error?.config?.url,
            requestStatus: resolvedStatus ?? error?.response?.status
          }
        })
        error.__cloudflareDialogShown = true
        error.__globalErrorHandled = true
      }

      if (normalized.isNotFound && requestPolicy.notFound === REQUEST_POLICY_NOT_FOUND.ROUTE_404) {
        error.__globalErrorHandled = true
        router.replace('/404')
        return
      }

      if (normalized.isUnauthorized && requestPolicy.authRedirect === REQUEST_POLICY_AUTH_REDIRECT.GLOBAL) {
        error.__globalErrorHandled = true
        router.replace('/')
        return
      }

      let msg = getGlobalApiErrorMessage(error)
      const timeout = 0

      if (!skipNotify && !normalized.isCloudflareGateway) {
        error.__globalErrorHandled = true
        notifyError(msg, {
          timeout
        })
      }
    }
  })

  app.config.globalProperties.$api = api
})
