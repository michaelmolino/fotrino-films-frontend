import { boot } from 'quasar/wrappers'
import { Dialog } from 'quasar'
import { useAccountStore } from 'src/stores/account-store'
import { api, installApiClientInterceptors } from 'src/clients/axios-client.js'
import { useRequestLoading } from 'src/composables/useRequestLoading'
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
      const skipNotify = requestPolicy.errorHandling !== 'global' || componentErrorPayload != null

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
            requestStatus: resolvedStatus ?? error?.response?.status
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

      if (isNotFound && requestPolicy.notFoundHandling !== 'none') {
        error.__globalErrorHandled = true
        router.replace('/404')
        return
      }

      if (!skipNotify && !cloudflarePayload) {
        error.__globalErrorHandled = true
        notifyError(getGlobalApiErrorMessage(error), { timeout: 0 })
      }
    }
  })

  app.config.globalProperties.$api = api
})
