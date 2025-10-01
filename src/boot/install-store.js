import { boot } from 'quasar/wrappers'
import createStore from 'src/store'

// Create a singleton store and install it during the earliest boot phase
// This feels like a hack; ideally Quasar should do this
let appStore
export default boot(({ app }) => {
    if (!appStore) {
        appStore = createStore()
    }
    app.use(appStore)
})
