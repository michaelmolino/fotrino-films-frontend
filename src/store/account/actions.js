import axios from 'axios'
import { nullProfile } from 'boot/global'

export function fetchProfile (context) {
  return axios
    .get('/api/account/profile')
    .then(response => {
      context.commit('SET_PROFILE', response.data)
    })
    .catch(error => {
      context.commit('SET_PROFILE', nullProfile)
      return Promise.reject(error)
    })
}
