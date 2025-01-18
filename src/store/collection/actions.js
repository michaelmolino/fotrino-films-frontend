import { LocalStorage } from 'quasar'
import _ from 'underscore'
import { api } from 'boot/axios'
import DOMPurify from 'dompurify'
import { nullCollection, nullChapter } from 'boot/global'

export async function getPrivateChapter(context, chapter) {
  try {
    const response = await api
      .get('/collections/chapters/private/' + chapter)
    const collection = response.data
    collection.movie.chapter.description_sanitised = DOMPurify.sanitize(collection.movie.chapter.description_unsafe, {
      ALLOWED_TAGS: ['br', 'i', 'p', 'strong']
    })
    context.commit('SET_PRIVATE_CHAPTER', collection)
  } catch (error) {
    context.commit('SET_PRIVATE_CHAPTER', nullChapter)
    return await Promise.reject(error)
  }
}

export function createCollection(context, collection) {
  return api.post('/collections', collection).catch(error => {
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
          ch.description_text = ch.description_sanitised.replace(
            /<br[^>]*>/gi,
            '\n'
          )
          ch.description_text = ch.description_text.replace(
            /<\/?p[^>]*>/gi,
            '\n'
          )
          ch.description_text = DOMPurify.sanitize(ch.description_text, {
            ALLOWED_TAGS: []
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
