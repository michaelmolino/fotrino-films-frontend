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
    plugins: [createCache({ timeout: 3600000 })],
    strict: process.env.DEBUGGING
  })
  return Store
}
