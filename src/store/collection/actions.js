import { LocalStorage } from 'quasar'
import _ from 'underscore'
import axios from 'axios'
import DOMPurify from 'dompurify'
import { nullCollection } from 'boot/global'

export function fetchCollection (context, uuid) {
  if (!uuid) {
    context.commit('SET_COLLECTION', nullCollection)
    return Promise.resolve(nullCollection)
  }

  return axios
    .get('/api/collections/' + uuid)
    .then(response => {
      const collection = response.data
      collection.movies = collection.movies.sort((a, b) => {
        return a.sort - b.sort
      })
      collection.movies.forEach(m => {
        m.chapters = m.chapters.sort((a, b) => {
          return a.sort - b.sort
        })
        m.chapters.forEach(ch => {
          ch.description_sanitised = DOMPurify.sanitize(ch.description_unsafe, { ALLOWED_TAGS: ['br', 'i', 'p', 'strong'] })
        })
      })
      context.commit('SET_COLLECTION', collection)

      const history = LocalStorage.getItem('fotrino-films-history') || []
      history.push(
        {
          uuid: collection.uuid,
          title: collection.title,
          slug: collection.slug
        }
      )
      const uniq = _.uniq(history, c => c.uuid)
      context.commit('SET_HISTORY', uniq)
      LocalStorage.set('fotrino-films-history', uniq)

      return Promise.resolve(collection)
    })
    .catch(error => {
      context.commit('SET_COLLECTION', nullCollection)
      rmHistory(context, uuid)
      return Promise.reject(error)
    })
}

export function fetchCollections (context) {
  return axios
    .get('/api/collections')
    .then(response => {
      context.commit('SET_COLLECTIONS', response.data)
      return Promise.resolve(response.data)
    })
    .catch(error => {
      context.commit('SET_COLLECTIONS', [])
      return Promise.reject(error)
    })
}

export function fetchHistory (context) {
  const history = LocalStorage.getItem('fotrino-films-history') || []
  context.commit('SET_HISTORY', history)
  return Promise.resolve(history)
}

export function rmHistory (context, uuid) {
  const history = context.state.history.filter(
    function (o) {
      return o.uuid !== uuid
    }
  )
  context.commit('SET_HISTORY', history)
  LocalStorage.set('fotrino-films-history', history)
}

export function createCollection (context, collection) {
  return axios
    .post('/api/collections',
      {
        title: collection.title,
        filename: collection.filename
      }
    )
    .catch(error => {
      return Promise.reject(error)
    })
}

export function createMovie (context, movie) {
  return axios
    .post('/api/collections/movies',
      {
        collection: movie.collection,
        title: movie.title,
        subtitle: movie.subtitle,
        filename: movie.filename
      }
    )
    .catch(error => {
      return Promise.reject(error)
    })
}

export function editCollection (context, collection) {
  return axios
    .put('/api/collections/' + collection.uuid,
      {
        title: collection.title,
        deleted: collection.deleted
      }
    )
    .catch(error => {
      return Promise.reject(error)
    })
}
