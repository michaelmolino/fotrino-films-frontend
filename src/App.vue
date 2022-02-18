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
    this.$store.dispatch('account/getProfile')
      .catch(error => {
        console.log(error)
      })
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
      },
      set (_collection) {
        this.$store.commit('collection/SET_COLLECTION', _collection)
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
        .dispatch('collection/getCollection', to.params.uuid)
        .then(_collection => {
          this.collection = _collection
          this.updatePageProperties()
        })
        .catch(() => {
          this.collection = this.$nullCollection
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
      if (this.collection.deleted === true && this.$route.params.collectionSlug) {
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
