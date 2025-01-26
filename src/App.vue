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
    this.$store.dispatch('account/getProfile').catch(error => {
      console.log(error)
    })
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
      set(_collection) {
        if (this.$route.params?.uuid) {
          this.$store.commit('collection/SET_COLLECTION', _collection)
        } else if (this.$route.params?.privateId) {
          this.$store.commit('collection/SET_PRIVATE_CHAPTER', _collection)
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
            this.updatePageProperties()
          })
          .catch(() => {
            this.collection = this.$nullCollection
            this.updatePageProperties()
          })
      } else if (to.params?.privateId) {
        this.$store.cache
          .dispatch('collection/getPrivateChapter', to.params.privateId)
          .then(_collection => {
            this.collection = this.$nullCollection
            this.updatePageProperties()
          })
          .catch(() => {
            this.collection = this.$nullCollection
            this.updatePageProperties()
          })
      }
    },
    collection() {
      if (
        this.collection?.uuid &&
        this.$route.params.collectionSlug &&
        this.collection.slug !== this.$route.params.collectionSlug
      ) {
        this.$router.replace({
          params: { collectionSlug: this.collection.slug }
        })
      }
      if (
        this.collection?.deleted === true &&
        this.$route.params?.collectionSlug
      ) {
        this.$q.notify({
          type: 'info',
          timeout: 0,
          message: 'This collection has been deleted. Only you can see it.',
          icon: 'info',
          multiLine: false,
          actions: [
            {
              label: 'Dismiss',
              color: 'white'
            }
          ]
        })
      }
      this.updatePageProperties()
    }
  }
}
</script>
