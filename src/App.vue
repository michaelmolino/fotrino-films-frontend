<template>
  <router-view />
</template>

<script>
import { useMeta } from 'quasar'
import { ref } from 'vue'
import { getMetaData } from '@javascript/library.js'

export default {
  name: 'App',

  created () {
    this.$store.dispatch('account/fetchProfile')
      .catch(() => {})
  },

  methods: {
    updatePageProperties () {
      this.metaData = getMetaData(this.$route, this.collection)
    }
  },

  computed: {
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    }
  },

  setup () {
    const metaData = ref(getMetaData(null, null))
    useMeta(() => {
      return metaData.value
    })
    return {
      metaData
    }
  },

  watch: {
    $route (to, from) {
      this.$store.cache
        .dispatch('collection/fetchCollection', to.params.uuid)
        .then(collection => {
          this.$store.commit('collection/SET_COLLECTION', collection)
          this.updatePageProperties()
        })
        .catch(() => {
          this.$store.commit('collection/SET_COLLECTION', this.$nullCollection)
          this.updatePageProperties()
        })
    },
    collection () {
      if (
        this.collection.uuid && this.$route.params.collectionSlug &&
        this.collection.slug !== this.$route.params.collectionSlug
      ) {
        this.$router.replace({
          params: { collectionSlug: this.collection.slug }
        })
      }
      this.updatePageProperties()
    }
  }
}
</script>
