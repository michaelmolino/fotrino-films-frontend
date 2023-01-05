import { boot } from 'quasar/wrappers'

import mitt from 'mitt'
const emitter = mitt()

export default boot(({ app }) => {
  app.config.globalProperties.$global = {
    $on: (...args) => emitter.on(...args),
    $once: (...args) => emitter.once(...args),
    $off: (...args) => emitter.off(...args),
    $emit: (...args) => emitter.emit(...args)
  }
})
