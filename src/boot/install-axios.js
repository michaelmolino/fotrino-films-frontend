import { boot } from 'quasar/wrappers'
import { Dialog } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { api, installApiClientInterceptors } from 'src/clients/axios-client.js'
import { useRequestLoading } from 'src/composables/useRequestLoading'
import { confirmDestructiveAction, notifyError } from 'src/utils/notify.js'
import { getGlobalApiErrorMessage, normalizeApiError } from 'src/utils/api-error-service.js'
import { getComponentApiErrorPayload } from 'src/utils/api-error-payloads.js'
import CloudflareGatewayErrorDialog from '@components/errors/CloudflareGatewayErrorDialog.vue'

const DEFAULT_REQUEST_POLICY = Object.freeze({
  csrfHandling: 'global',
  deleteHandling: 'global',
  notFoundHandling: 'none',
  errorHandling: 'global',
  loadHandling: 'global'
})

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
  const { increment: showLoader, decrement: hideLoader } = useRequestLoading()

  installApiClientInterceptors({
    resolveRequestPolicy,
    getCsrfToken: (req, requestPolicy) => {
      if (requestPolicy.csrfHandling !== 'global') {
        return null
      }
      return useAccountStore()?.profile?.csrfToken ?? null
    },
    onBeforeDelete: async (req, requestPolicy) => {
      if (requestPolicy.deleteHandling !== 'global') {
        return true
      }
      return await confirmDestructiveAction({
        confirmAction: { 'data-cy': 'confirm-delete' },
        cancelAction: { 'data-cy': 'cancel-delete' }
      })
    },
    onRequestStart: (req, requestPolicy) => {
      if (requestPolicy.loadHandling !== 'global') {
        return
      }
      showLoader()
    },
    onRequestEnd: (req, requestPolicy) => {
      if (requestPolicy.loadHandling !== 'global') {
        return
      }
      hideLoader()
    },
    onApiError: ({ error, status, requestCanceled, requestPolicy }) => {
      const normalizedError = normalizeApiError(error, { status, requestCanceled })
      const componentErrorPayload = getComponentApiErrorPayload(error)
      const skipNotify =
        requestPolicy.errorHandling !== 'global' ||
        normalizedError.requestCanceled ||
        componentErrorPayload != null
      const resolvedStatus = normalizedError.status

      if (normalizedError.requestCanceled) {
        return
      }

      if (normalizedError.isCloudflareGateway) {
        Dialog.create({
          component: CloudflareGatewayErrorDialog,
          componentProps: {
            payload: normalizedError.cloudflarePayload,
            requestMethod: error?.config?.method,
            requestUrl: error?.config?.url,
            requestStatus: resolvedStatus ?? error?.response?.status
          }
        })
        error.__cloudflareDialogShown = true
        error.__globalErrorHandled = true
      }

      if (normalizedError.isUnauthorized) {
        error.__globalErrorHandled = true
        router.replace('/')
        return
      }

      if (normalizedError.isNotFound && requestPolicy.notFoundHandling !== 'none') {
        error.__globalErrorHandled = true
        router.replace('/404')
        return
      }

      let msg = getGlobalApiErrorMessage(error)
      const timeout = 0

      if (!skipNotify && !normalizedError.isCloudflareGateway) {
        error.__globalErrorHandled = true
        notifyError(msg, {
          timeout
        })
      }
    }
  })

  app.config.globalProperties.$api = api
})
