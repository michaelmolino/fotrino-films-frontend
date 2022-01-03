import { LocalStorage } from 'quasar'

export function SET_COLLECTION (state, collection) {
  state.collection = collection

  const lastCollection = {
    collectionId: collection.uuid,
    title: collection.title
  }
  try {
    LocalStorage.set('fotrino-films-last', lastCollection)
  } catch (e) {
    console.log(e)
  }
}

export function SET_MOVIE (state, movie) {
  state.movie = movie
}

export function SET_CHAPTER (state, chapter) {
  state.chapter = chapter
}
