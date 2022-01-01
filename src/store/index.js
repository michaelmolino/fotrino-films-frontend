import { createStore } from 'vuex'
import collection from './collection'

export default function (/* { ssrContext } */) {
  const Store = createStore({
    modules: {
      collection
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING
  })

  return Store
}
