<template>
  <span v-if="lastCollection">
    There is not much here yet.  Perhaps you want to go back to
    <q-btn
      flat
      dense
      :label="lastCollection.title"
      :to="'/' + lastCollection.collectionId"
    />.
  </span>
</template>

<script>
import { useQuasar } from 'quasar'

export default {
  name: 'LastCollection',
  data () {
    return {
      lastCollection: false
    }
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
