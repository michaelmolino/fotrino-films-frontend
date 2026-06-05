import { boot } from 'quasar/wrappers'
import { useAccountStore } from 'src/stores/account-store.js'

export default boot(async () => {
  const accountStore = useAccountStore()
  await accountStore.fetchProfile()
})
