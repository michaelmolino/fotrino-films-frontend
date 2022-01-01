<template>
  <div style="max-width: 720px">
    <div class="q-pa-xl text-h3 text-center text-uppercase">Hello, World!</div>

    <div class="q-pl-xl text-body1 text-left">
      This website is private and by invitation only. You probably got here by
      accident. If you're looking for something specific, then make sure you
      followed the correct link.
      <p />
      Problems? creative@michaelmolino.com
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../javascript/library.js'

export default {
  name: 'Home',
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
