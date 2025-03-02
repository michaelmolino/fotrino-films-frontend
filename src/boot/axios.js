import { boot } from 'quasar/wrappers'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { Notify, Loading } from 'quasar'

const api = axios.create({ baseURL: process.env.API })
axiosRetry(api, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return error.code === 'ECONNABORTED' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' ||
       (!(error.config.method === 'PUT' && error.config.url === '/channels/media') &&
          ![400, 401, 402, 403, 404, 409, 500, 501].includes(error.response.status))
  }
})

const objectApi = axios.create()
axiosRetry(objectApi, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response.status === 408
  }
})

export default boot(({ app, router, store }) => {
  api.interceptors.request.use(req => {
    Loading.show()
    if (['post', 'put', 'delete'].includes(req.method)) {
      req.headers['X-CSRFToken'] = store.state.account.profile.csrf_token
    }
    return req
  })

  api.interceptors.response.use(
    function(response) {
      Loading.hide()
      return response
    },

    function(error) {
      Loading.hide()

      let msg = 'Something went wrong!'
      const actions = [{ label: 'Dismiss', color: 'white' }]
      switch (error.response.status) {
        case 400:
          msg = error.response.data
          break
        case 401:
          msg = 'Unauthorised.  Please login.'
          break
        case 402:
          msg = 'You have exceeded a limit for your account type.'
          break
        case 403:
          msg = 'Forbidden.'
          break
        case 404:
          router.replace('/404')
          return Promise.reject(error)
        case 409:
          router.replace('/409')
          return Promise.reject(error)
        case 501:
          msg = 'Not yet implemented.'
          break
      }

      Notify.create({
        type: 'negative',
        timeout: 0,
        message: msg,
        icon: 'fas fa-triangle-exclamation',
        multiLine: false,
        actions: actions
      })

      return Promise.reject(error)
    }
  )

  app.config.globalProperties.$api = api
})

export { api, objectApi }
