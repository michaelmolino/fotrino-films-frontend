import { Notify } from 'quasar'
import axios from 'axios'

export function fetchCollection (context, payload) {
  const userUuid = payload.userUuid
  const movieId = payload.movieId !== null ? Number(payload.movieId) : null
  const chapterId = payload.chapter !== null ? Number(payload.chapterId) : null
  return axios
    .get('/api/' + userUuid + '/movies')
    .then((response) => {
      let chapter = null
      let movie = null
      const collection = response.data

      if (movieId !== null) {
        movie = collection.movies.find((m) => m.id === movieId)
        movie.chapters = movie.chapters.sort((a, b) => {
          return a.sort - b.sort
        })
      }

      if (movieId !== null && chapterId !== null) {
        chapter = movie.chapters.find((ch) => ch.id === chapterId)
      }

      collection.movies = collection.movies.sort((a, b) => {
        return a.sort - b.sort
      })

      context.commit('SET_COLLECTION', collection)
      context.commit('SET_MOVIE', movie)
      context.commit('SET_CHAPTER', chapter)
    })
    .catch((error) => {
      context.commit('SET_COLLECTION', null)
      Notify.create({
        type: 'negative',
        timeout: 0,
        message: 'Something went wrong! ' + error,
        icon: 'warning',
        multiLine: true
      })
    })
}
