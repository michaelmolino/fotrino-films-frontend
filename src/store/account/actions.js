import { api } from 'boot/axios'

export function getProfile(context) {
  return api
    .get('/account/profile')
    .then(response => {
      const profile = response.data
      context.commit('SET_PROFILE', profile)
      return Promise.resolve(profile)
    })
    .catch(error => {
      context.commit('SET_PROFILE', null)
      return Promise.reject(error)
    })
}

export function getToken(context) {
  return api
    .get('/account/token')
    .then(response => {
      const token = response.data.token
      context.commit('SET_TOKEN', token)
      return Promise.resolve(token)
    })
    .catch(error => {
      context.commit('SET_TOKEN', null)
      return Promise.reject(error)
    })
}
