import { boot } from 'quasar/wrappers'
import { useDarkMode } from '@utils/dark.js'

export default boot(({ app }) => {
    const $q = app.config.globalProperties.$q
    // Initialize dark mode early in the boot process
    useDarkMode($q)
})
