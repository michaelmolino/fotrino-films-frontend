import { api } from 'boot/axios'
import { nullProfile } from 'boot/global'

export function getProfile(context) {
  return api
    .get('/account/profile')
    .then(response => {
      context.commit('SET_PROFILE', response.data)
    })
    .catch(error => {
      context.commit('SET_PROFILE', nullProfile)
      return Promise.reject(error)
    })
}
