import { Notify, Loading } from 'quasar'
import axios from 'axios'

export function fetchCollection (context, userUuid) {
  Loading.show()

  return axios
    .get('/api/' + userUuid + '/movies')
    .then(response => {
      const collection = response.data
      collection.uuid = userUuid

      collection.movies = collection.movies.sort((a, b) => {
        return a.sort - b.sort
      })
      collection.movies.forEach(m => {
        m.chapters = m.chapters.sort((a, b) => {
          return a.sort - b.sort
        })
      })

      context.commit('SET_COLLECTION', collection)

      Loading.hide()
    })
    .catch(() => {
      context.commit('SET_COLLECTION', null)

      Notify.create({
        type: 'negative',
        timeout: 0,
        message: 'Something went wrong!',
        icon: 'warning',
        multiLine: true
      })

      Loading.hide()
    })
}
