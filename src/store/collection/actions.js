import { LocalStorage } from 'quasar'
import _ from 'underscore'
import { api } from 'boot/axios'

function updateHistory(context, collection) {
  const history = LocalStorage.getItem('fotrino-films-history') || []
  history.push({
    uuid: collection.uuid,
    title: collection.title,
    slug: collection.slug
  })
  const uniq = _.uniq(history, c => c.uuid)
  context.commit('SET_HISTORY', uniq)
  LocalStorage.set('fotrino-films-history', uniq)
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

export function getCollection(context, uuid) {
  return api
    .get('/collections/' + uuid)
    .then(response => {
      const collection = response.data
      collection.movies = collection.movies.sort((a, b) => { return a.sort - b.sort })
      collection.movies.forEach(m => { m.chapters = m.chapters.sort((a, b) => { return a.sort - b.sort }) })
      context.commit('SET_COLLECTION', collection)
      updateHistory(context, collection)
      return Promise.resolve(collection)
    })
    .catch(error => {
      context.commit('SET_COLLECTION', null)
      rmHistory(context, uuid)
      return Promise.reject(error)
    })
}

export function getPrivateChapter(context, privateId) {
  return api
    .get('/collections/chapters/private/' + privateId)
    .then(response => {
      const collection = response.data
      context.commit('SET_COLLECTION', collection)
      return Promise.resolve(collection)
    })
    .catch(error => {
      context.commit('SET_COLLECTION', null)
      return Promise.reject(error)
    })
}

export function getHistory(context) {
  const history = LocalStorage.getItem('fotrino-films-history') || []
  context.commit('SET_HISTORY', history)
  return Promise.resolve(history)
}

export function rmHistory(context, uuid) {
  const history = context.state.history.filter(u => u.uuid !== uuid)
  context.commit('SET_HISTORY', history)
  LocalStorage.set('fotrino-films-history', history)
}
