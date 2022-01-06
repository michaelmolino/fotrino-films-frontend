import { createStore } from 'vuex'
import createCache from 'vuex-cache'
import account from './account'
import collection from './collection'

export default function (/* { ssrContext } */) {
  const Store = createStore({
    modules: {
      account,
      collection
    },
    plugins: [createCache()],

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING
  })

  return Store
}
