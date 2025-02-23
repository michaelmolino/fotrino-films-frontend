import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { Notify, Loading } from 'quasar'

const api = axios.create({ baseURL: process.env.API })

export default boot(({ app, router, store }) => {
  api.interceptors.request.use(req => {
    if (req.url !== '/upload/media' && req.url !== '/upload/keep-alive') {
      Loading.show()
    }
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
      switch (error.response.status) {
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
        actions: [
          {
            label: 'Dismiss',
            color: 'white'
          }
        ]
      })

      return Promise.reject(error)
    }
  )

  app.config.globalProperties.$api = api
})

export { api }
