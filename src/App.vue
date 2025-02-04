<template>
  <router-view />
</template>

<script>
import { useMeta } from 'quasar'
import { ref } from 'vue'
import { getMetaData } from '@javascript/library.js'

export default {
  name: 'App',

  setup() {
    const metaData = ref(getMetaData(null, null))
    useMeta(() => {
      return metaData.value
    })
    return {
      metaData
    }
  },

  created() {
    this.$store.dispatch('account/getProfile')
  },

  computed: {
    collection: {
      get() {
        if (this.$route.params?.uuid || this.$route.params.privateId) {
          return this.$store.state.collection.collection
        }
        return null
      },
      set(value) {
        this.$store.commit('collection/SET_COLLECTION', value)
      }
    }
  },

  watch: {
    $route(to, from) {
      if (to.params?.uuid) {
        this.$store.cache
          .dispatch('collection/getCollection', to.params.uuid)
          .then(_collection => {
            this.collection = _collection
            this.metaData = getMetaData(this.$route, _collection)
          })
          .catch(() => {
            this.collection = null
          })
      } else if (to.params?.privateId) {
        this.$store.cache
          .dispatch('collection/getPrivateChapter', to.params.privateId)
          .then(_collection => {
            this.collection = _collection
            this.metaData = getMetaData(this.$route, _collection)
          })
          .catch(() => {
            this.collection = null
          })
      } else {
        this.metaData = getMetaData(this.$route, null)
      }
    },

    collection() {
      if (this.collection?.uuid) {
        this.$router.replace({
          params: { collectionSlug: this.collection.slug }
        })
      }
    }
  }
}
</script>
