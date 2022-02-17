import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { Notify, Loading } from 'quasar'

export default boot(({ app, router, store }) => {
  axios.interceptors.request.use(config => {
    Loading.show()
    // TODO: I only want this for local API calls, not calls to third parties like S3
    if (['post', 'put', 'delete'].includes(config.method)) {
      config.headers['X-CSRFToken'] = store.state.account.profile.csrf_token
    }
    return config
  })

  axios.interceptors.response.use(
    function (response) {
      Loading.hide()
      return response
    },

    function (error) {
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
      }

      Notify.create({
        type: 'negative',
        timeout: 0,
        message: msg,
        icon: 'warning',
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

  app.config.globalProperties.$axios = axios
})

export { axios }
