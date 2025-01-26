<template>
  <router-view />
</template>

<script>
import { useMeta } from 'quasar'
import { ref } from 'vue'
import { getMetaData } from '@javascript/library.js'

export default {
  name: 'App',

  created() {
    this.$store.dispatch('account/getProfile')
  },

  methods: {
    updatePageProperties() {
      this.metaData = getMetaData(this.$route, this.collection)
    }
  },

  computed: {
    collection: {
      get() {
        let _collection = null
        if (this.$route.params?.uuid) {
          _collection = this.$store.state.collection.collection
        } else if (this.$route.params.privateId) {
          _collection = this.$store.state.collection.privateChapter
        }
        return _collection
      },
      set(value) {
        if (this.$route.params?.uuid) {
          this.$store.commit('collection/SET_COLLECTION', value)
        } else if (this.$route.params?.privateId) {
          this.$store.commit('collection/SET_PRIVATE_CHAPTER', value)
        }
      }
    }
  },

  setup() {
    const metaData = ref(getMetaData(null, null))
    useMeta(() => {
      return metaData.value
    })
    return {
      metaData
    }
  },

  watch: {
    $route(to, from) {
      if (to.params?.uuid) {
        this.$store.cache
          .dispatch('collection/getCollection', to.params.uuid)
          .then(_collection => {
            this.collection = _collection
          })
          .catch(() => {
            this.collection = this.$nullCollection
          })
      } else if (to.params?.privateId) {
        this.$store.cache
          .dispatch('collection/getPrivateChapter', to.params.privateId)
      }
      this.updatePageProperties()
    },
    collection() {
      if (this.collection?.uuid) {
        this.$router.replace({
          params: { collectionSlug: this.collection.slug }
        })
      }
      this.updatePageProperties()
    }
  }
}
</script>
