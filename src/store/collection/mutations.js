import { LocalStorage } from 'quasar'

export function SET_COLLECTION (state, collection) {
  state.collection = collection

  try {
    const lastCollection = {
      collectionId: collection.uuid,
      title: collection.title
    }
    LocalStorage.set('fotrino-films-last', lastCollection)
  } catch (e) {}
}
