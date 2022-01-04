import { LocalStorage } from 'quasar'

export function SET_COLLECTION (state, collection) {
  state.collection = collection

  const lastCollection = {
    collectionId: collection.uuid,
    title: collection.title
  }
  try {
    LocalStorage.set('fotrino-films-last', lastCollection)
  } catch (e) {}
}
