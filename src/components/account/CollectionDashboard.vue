<template>
  <div>
    <div v-if="profile.id">
      Not much to see here.
      <ul>
        <li v-for="c in collections" :key="c.id">{{ c.uuid }}</li>
      </ul>
      Coming "soon": The ability to create and upload content via a local bash script.
    </div>
    <div v-if="!profile.id" class="q-py-md">
      Not logged in!
    </div>
  </div>
</template>

<script>

export default {
  name: 'Collection-Dashboard',

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    },
    collections: {
      get() {
        return this.$store.state.collection.collections
      }
    }
  },

  created: function() {
    this.$store.cache.dispatch('collection/getCollections').catch(error => {
      console.log(error)
    })
  }
}
</script>
