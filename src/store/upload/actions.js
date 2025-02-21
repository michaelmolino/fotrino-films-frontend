import { api } from 'boot/axios'

export function postFile(context, params) {
  const formData = params.formData
  const uploadToken = params.uploadToken
  return api
    .post('/upload/media', formData, {
      headers: {
        'X-Upload-Token': uploadToken
      }
    })
    .then(() => {
      return Promise.resolve()
    })
    .catch(error => {
      return Promise.reject(error)
    })
}
