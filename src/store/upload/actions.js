import { api } from 'boot/axios'

export function postFile(context, params) {
  const formData = params.formData
  const uploadToken = params.uploadToken
  const onUploadProgress = params.onUploadProgress

  return api
    .post('/upload/media', formData, {
      headers: {
        'X-Upload-Token': uploadToken
      },
      onUploadProgress: (progressEvent) => {
        onUploadProgress(progressEvent)
        if (progressEvent.loaded % (1024 * 1024 * 5) === 0) {
          api.post('/upload/keep-alive').catch(console.error)
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
