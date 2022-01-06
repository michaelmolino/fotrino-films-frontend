<template>
  <div style="max-width: 720px">
    <div class="q-pa-md text-h6 text-center">Hello, World!</div>
    <div class="q-pl-md text-body1 text-left">
      <span>
        This website is private and by invitation only. You probably got here by
        accident. If you're looking for something specific, then make sure you
        followed the correct link.
      </span>
      <p />
      <LastCollection />
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
import { defineAsyncComponent } from 'vue'
import { setMetaData } from '../javascript/library.js'

export default {
  name: 'Home',
  components: {
    LastCollection: defineAsyncComponent(() =>
      import('../components/LastCollection.vue')
    )
  },
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
