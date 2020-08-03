import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { Notify, Loading } from 'quasar'

export default boot(({ app, router, store }) => {
  Loading.show()

  axios.interceptors.request.use(config => {
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
          return Promise.reject(error)
        case 402:
          msg = 'You have exceeded a limit for your account type.'
          break
        case 404:
          router.replace('/404')
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
