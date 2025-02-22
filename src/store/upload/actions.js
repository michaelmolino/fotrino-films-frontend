import { api } from 'boot/axios'
import axios from 'axios'
import { Loading } from 'quasar'

export function putObject(context, params) {
  Loading.show()
  axios.put(params.url, params.file, {
    headers: {
      'Content-Type': params.file.type
    }
  }).then(() => {
    Loading.hide()
  }).catch(() => {
    Loading.hide()
  })
}

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
