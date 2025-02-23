import { createStore } from 'vuex'
import createCache from 'vuex-cache'
import account from './account'
import channel from './channel'
import upload from './upload'

export default function(/* { ssrContext } */) {
  const Store = createStore({
    modules: {
      account,
      channel,
      upload
    },
    plugins: [createCache({ timeout: 3600000 })],
    strict: process.env.DEBUGGING
  })
  return Store
}
