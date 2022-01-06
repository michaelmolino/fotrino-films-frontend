<template>
  <span>
    <div v-if="profile" class="q-pa-md text-h6 text-center"
    style="max-width: 720px">
      Dashboard
    </div>
    <div
      v-else
      class="q-pa-md text-h6 text-center"
      style="max-width: 720px"
    >
      Not logged in!
    </div>
    <div class="q-pl-md text-body1 text-left">
      <LastCollection />
    </div>
  </span>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { useMeta } from 'quasar'
import { setMetaData } from '../../javascript/library.js'

export default {
  name: 'Dashboard',
  components: {
    LastCollection: defineAsyncComponent(() =>
      import('../../components/LastCollection.vue')
    )
  },
  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    }
  },
  setup () {
    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })
  }
}
</script>
