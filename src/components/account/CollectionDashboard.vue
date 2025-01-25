<template>
  <div>
    <div v-if="profile.id">
        <div v-if="collections.length === 0">Not much to see here</div>
        <div v-for="c in collections" :key="c.id" class="q-py-xs">
          <q-btn flat :to="'/' + c.uuid + '/' + c.slug">
            <q-avatar>
              <img :src="c.cover">
            </q-avatar>
            <div class="q-pl-sm">{{ c.title }}</div>
          </q-btn>
        </div>
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
