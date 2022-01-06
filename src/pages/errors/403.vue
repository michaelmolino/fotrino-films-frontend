<template>
  <div
    class="fullscreen bg-warning text-black text-center q-pa-md flex flex-center"
  >
    <div>
      <div style="font-size: 30vh">403</div>
      <div class="text-h2" style="opacity: 0.4">Not Authorised</div>
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../../javascript/library.js'

export default {
  name: 'Error403',
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
