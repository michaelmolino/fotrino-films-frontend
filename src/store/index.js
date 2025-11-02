import { createStore } from 'vuex'
import createCache from 'vuex-cache'
import account from './account'
import admin from './admin'
import channel from './channel'

export default function createStoreInstance() {
  const Store = createStore({
    modules: {
      account,
      admin,
      channel
    },
    plugins: [createCache({ timeout: 3600000 })],
    strict: process.env.DEBUGGING
  })
  return Store
}
