import { nullCollection, nullChapter } from 'boot/global'

export default function() {
  return {
    collection: nullCollection,
    collections: [],
    history: [],
    privateChapter: nullChapter
  }
}
