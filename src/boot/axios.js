import { boot } from 'quasar/wrappers'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { Notify, Loading } from 'quasar'

const shouldRetryApi = (error) => {
  const status = error?.response?.status
  if (status == null) {
    return axiosRetry.isNetworkOrIdempotentRequestError(error)
  }
  return ![400, 401, 402, 403, 404, 409, 500, 501].includes(status)
}

const shouldRetryObjects = (error) => {
  const status = error?.response?.status
  return axiosRetry.isNetworkOrIdempotentRequestError(error) || status === 408
}

const api = axios.create({ baseURL: process.env.API })
axiosRetry(api, { retries: 6, retryDelay: axiosRetry.exponentialDelay, retryCondition: shouldRetryApi })

const objectApi = axios.create()
axiosRetry(objectApi, { retries: 6, retryDelay: axiosRetry.exponentialDelay, retryCondition: shouldRetryObjects })

export default boot(({ app, router, store }) => {
  // Track concurrent requests to avoid hiding the loader too early
  let pending = 0
  const showLoader = () => {
    if (pending === 0) {
      Loading.show()
    }
    pending++
  }
  const hideLoader = () => { pending = Math.max(0, pending - 1); if (pending === 0) Loading.hide() }

  api.interceptors.request.use(req => {
    const method = (req.method || '').toLowerCase()
    // Attach CSRF only when available and required
    if (['post', 'put', 'delete'].includes(method)) {
      const token = store?.state?.account?.profile?.csrf_token
      if (token) {
        req.headers['X-CSRFToken'] = token
      }
    }

    if (method === 'delete') {
      // Confirm destructive action, optionally cancel the request
      return new Promise((resolve, reject) => {
        Notify.create({
          type: 'negative',
          timeout: 0,
          message: 'Resources will be immediately deleted; this action cannot be undone!',
          position: 'center',
          icon: 'fas fa-info',
          multiLine: true,
          actions: [
            { icon: 'fas fa-circle-exclamation', label: 'Confirm delete', color: 'white', handler: () => { showLoader(); resolve(req) } },
            { icon: 'fas fa-rotate-left', label: 'Go Back', color: 'white', handler: () => { reject(new axios.Cancel('User cancelled delete')) } }
          ]
        })
      })
    }

    showLoader()
    return req
  })

  api.interceptors.response.use(
    (response) => {
      hideLoader()
      return response
    },
    (error) => {
      hideLoader()

      const status = error?.response?.status
      const url = error?.response?.config?.url

      // Special case: allow SSO (commentbox) to handle 401 itself
      if (status === 401 && url?.endsWith('/sso/commentbox')) {
        return Promise.resolve(error.response)
      }

      if (status === 404) {
        router.replace('/404')
        return Promise.reject(error)
      }
      if (status === 409) {
        router.replace('/409')
        return Promise.reject(error)
      }

      let msg = 'Something went wrong!'
      if (status === 400) msg = error?.response?.data || msg
      else if (status === 401) msg = 'Unauthorised. Please login.'
      else if (status === 402) msg = 'You have exceeded a limit for your account type.'
      else if (status === 403) msg = 'Forbidden.'
      else if (status === 501) msg = 'Not yet implemented.'

      if (error.code === 'ERR_CANCELED') {
        msg = 'Request cancelled.'
      }

      Notify.create({
        type: 'negative',
        timeout: 0,
        message: msg,
        icon: 'fas fa-triangle-exclamation',
        actions: [{ label: 'Dismiss', color: 'white' }]
      })

      if (status === 401) {
        router.replace('/')
      }

      return Promise.reject(error)
    }
  )

  app.config.globalProperties.$api = api
})

export { api, objectApi }
