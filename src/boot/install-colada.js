import { boot } from 'quasar/wrappers'
import { PiniaColada } from '@pinia/colada'

export default boot(({ app }) => {
    app.use(PiniaColada)
})
