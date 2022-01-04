<template>
  <div style="max-width: 720px">
    <div class="q-pa-xl text-h6 text-center text-uppercase">Hello, World!</div>
    <div class="q-pl-xl text-body1 text-left">
      <span v-if="lastCollection">
        Not much here... You probably meant to visit
        <q-btn
          flat
          dense
          :label="lastCollection.title"
          :to="'/' + lastCollection.collectionId"
        />.
      </span>
      <span v-else>
        This website is private and by invitation only. You probably got here by
        accident. If you're looking for something specific, then make sure you
        followed the correct link.
      </span>
      <p />
      Problems?
      <p />
      <q-btn
        flat
        icon="email"
        label="creative@michaelmolino.com"
        href="mailto:creative@michaelmolino.com"
      />
    </div>
  </div>
</template>

<script>
import { useMeta, useQuasar } from 'quasar'
import { setMetaData } from '../javascript/library.js'

export default {
  name: 'Home',
  data () {
    return {
      lastCollection: false
    }
  },
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  },
  created () {
    const $q = useQuasar()

    try {
      this.lastCollection = $q.localStorage.getItem('fotrino-films-last')
    } catch (e) {
      console.log(e)
    }
  }
}
</script>
