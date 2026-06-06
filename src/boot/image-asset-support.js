import { boot } from 'quasar/wrappers'
import { initializeImageAssetSupport } from '@utils/image-asset.js'

export default boot(async () => {
  await initializeImageAssetSupport()
})
