import { api } from 'boot/axios'

export function postFile(context, params) {
  const formData = params.formData
  const uploadToken = params.uploadToken
  const onUploadProgress = params.onUploadProgress

  let nextKeepAliveThreshold = 5 * 1024 * 1024

  return api
    .post('/upload/media', formData, {
      headers: {
        'X-Upload-Token': uploadToken
      },
      onUploadProgress: (progressEvent) => {
        onUploadProgress(progressEvent)
        if (progressEvent.loaded >= nextKeepAliveThreshold) {
          api.post('/upload/keep-alive').catch(console.error)
          nextKeepAliveThreshold += 5 * 1024 * 1024
        }
      }
    })
    .then(() => {
      return Promise.resolve()
    })
    .catch(error => {
      return Promise.reject(error)
    })
}
