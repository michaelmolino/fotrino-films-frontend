import { api } from 'boot/axios'

export function getProfile(context) {
  return api
    .get('/account/profile')
    .then(response => {
      context.commit('SET_PROFILE', response.data)
    })
    .catch(error => {
      context.commit('SET_PROFILE', null)
      return Promise.reject(error)
    })
}
