import { LocalStorage } from 'quasar'
import _ from 'underscore'
import { api } from 'boot/axios'
import DOMPurify from 'dompurify'
import { nullCollection } from 'boot/global'

export function createCollection(context, collection) {
  return api
    .post('/collections', {
      title: collection.title,
      filename: collection.filename
    })
    .catch(error => {
      return Promise.reject(error)
    })
}

export function getCollection(context, uuid) {
  if (!uuid) {
    context.commit('SET_COLLECTION', nullCollection)
    return Promise.resolve(nullCollection)
  }

  return api
    .get('/collections/' + uuid)
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
          ch.description_sanitised = DOMPurify.sanitize(ch.description_unsafe, {
            ALLOWED_TAGS: ['br', 'i', 'p', 'strong']
          })
        })
      })
      context.commit('SET_COLLECTION', collection)

      const history = LocalStorage.getItem('fotrino-films-history') || []
      history.push({
        uuid: collection.uuid,
        title: collection.title,
        slug: collection.slug
      })
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

export function getCollections(context) {
  return api
    .get('/collections')
    .then(response => {
      const collections = response.data
      context.commit('SET_COLLECTIONS', collections)
      return Promise.resolve(collections)
    })
    .catch(error => {
      context.commit('SET_COLLECTIONS', [])
      return Promise.reject(error)
    })
}

export function editCollection(context, collection) {
  return api.put('/collections/' + collection.uuid, collection).catch(error => {
    return Promise.reject(error)
  })
}

export function createMovie(context, movie) {
  return api
    .post('/collections/movies', {
      collection: movie.collection,
      title: movie.title,
      subtitle: movie.subtitle,
      filename: movie.filename
    })
    .catch(error => {
      return Promise.reject(error)
    })
}

export function editMovie(context, movie) {
  return api
    .put('/collections/movies/' + movie.id, {
      collection: movie.collection,
      title: movie.title,
      subtitle: movie.subtitle,
      filename: movie.filename,
      deleted: movie.deleted
    })
    .catch(error => {
      return Promise.reject(error)
    })
}

export function getHistory(context) {
  const history = LocalStorage.getItem('fotrino-films-history') || []
  context.commit('SET_HISTORY', history)
  return Promise.resolve(history)
}

export function rmHistory(context, uuid) {
  const history = context.state.history.filter(function(o) {
    return o.uuid !== uuid
  })
  context.commit('SET_HISTORY', history)
  LocalStorage.set('fotrino-films-history', history)
}
