import { boot } from 'quasar/wrappers'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { Notify, Loading } from 'quasar'

const api = axios.create({ baseURL: process.env.API })
axiosRetry(api, {
  retries: 6,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return ![400, 401, 402, 403, 404, 409, 500, 501].includes(error.response.status)
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
    if (['post', 'put', 'delete'].includes(req.method)) {
      req.headers['X-CSRFToken'] = store.state.account.profile.csrf_token
    }
    if (req.method === 'delete') {
      return new Promise((resolve, reject) => {
        Notify.create({
          type: 'negative',
          timeout: 0,
          message: 'Resources will be immediately deleted; this action cannot be undone!',
          position: 'center',
          icon: 'fas fa-info',
          multiLine: true,
          actions: [
            { icon: 'fas fa-circle-exclamation', label: 'Confirm delete', color: 'white', handler: () => { Loading.show(); resolve(req) } },
            { icon: 'fas fa-rotate-left', label: 'Go Back', color: 'white', handler: () => { /* Do Nothing */ } }
          ]
        })
      })
    } else {
      Loading.show()
      return req
    }
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
      switch (error.response?.status) {
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
