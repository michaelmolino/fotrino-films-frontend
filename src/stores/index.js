import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'

export default store(function () {
  const pinia = createPinia()
  return pinia
})
