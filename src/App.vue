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

  methods: {
    updatePageProperties(r, c) {
      this.metaData = getMetaData(r, c)
    }
  },

  computed: {
    collection: {
      get() {
        let _collection = null
        if (this.$route.params?.uuid || this.$route.params.privateId) {
          _collection = this.$store.state.collection.collection
        }
        return _collection
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
            this.updatePageProperties(this.$route, _collection)
          })
          .catch(() => {
            this.collection = this.$nullCollection
          })
      } else if (to.params?.privateId) {
        this.$store.cache
          .dispatch('collection/getPrivateChapter', to.params.privateId)
          .then(_collection => {
            this.collection = _collection
            this.updatePageProperties(this.$route, _collection)
          })
          .catch(() => {
            this.collection = this.$nullCollection
          })
      }
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
</script>
