import { boot } from 'quasar/wrappers'
import { useAccountStore } from 'src/stores/account-store'
import { api, installApiClientInterceptors } from 'src/clients/axios-client.js'
import { useRequestLoading } from 'src/composables/useRequestLoading'
import { confirmDestructiveAction, notifyError } from 'src/utils/notify.js'
import { getGlobalApiErrorMessage, isGlobalApiError } from 'src/utils/api-errors.js'

export default boot(({ app, router }) => {
    const { increment: showLoader, decrement: hideLoader } = useRequestLoading()

    installApiClientInterceptors({
        getCsrfToken: () => useAccountStore()?.profile?.csrfToken,
        onBeforeDelete: req => {
            if (req?.__skipDeleteConfirm === true) {
                return true
            }

            return confirmDestructiveAction({
                confirmAction: { 'data-cy': 'confirm-delete' },
                cancelAction: { 'data-cy': 'cancel-delete' }
            })
        },
        onRequestStart: req => {
            if (req?.__skipRequestLoading !== true) {
                showLoader()
            }
        },
        onRequestEnd: config => {
            if (config?.__skipRequestLoading !== true) {
                hideLoader()
            }
        },
        onApiError: ({ error, apiError, status, requestCanceled }) => {
            const skipNotify = error?.config?.__skipGlobalErrorNotify === true || requestCanceled

            if (isGlobalApiError(error, 'not_found') && error?.config?.__redirectNotFoundTo404 === true) {
                router.replace('/404')
                return
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
        }
    })

    app.config.globalProperties.$api = api
})