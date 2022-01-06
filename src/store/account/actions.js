import { Notify, Loading } from 'quasar'
import axios from 'axios'

export function fetchProfile (context) {
  Loading.show()

  return axios
    .get('/api/account/profile')
    .then(response => {
      context.commit('SET_PROFILE', response.data)

      Loading.hide()
    })
    .catch((error) => {
      context.commit('SET_PROFILE', null)
      if (error.response.status !== 403) {
        Notify.create({
          type: 'negative',
          timeout: 0,
          message: 'Something went wrong!',
          icon: 'warning',
          multiLine: false,
          actions: [
            {
              label: 'Dismiss',
              color: 'white'
            }
          ]
        })
      }
      Loading.hide()
    })
}
