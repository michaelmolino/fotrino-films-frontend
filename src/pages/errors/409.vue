<template>
  <div
    class="fullscreen bg-warning text-black text-center q-pa-md flex flex-center"
  >
    <div>
      <div style="font-size: 30vh">409</div>
      <div class="text-h2" style="opacity: 0.4">Sorry, this account is already authorised with a different oauth provider.</div>
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../../javascript/library.js'

export default {
  name: 'Error409',
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
