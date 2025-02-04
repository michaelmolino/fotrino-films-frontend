<template>
  <div v-if="profile?.id" class="q-pa-lg">
    <q-img :src="profile.profile_pic" style="width: 250px">
      <q-badge class="bg-accent q-pa-md" floating transparent>
        <q-icon :name="'fab fa-' + profile.identity_provider" />
      </q-badge>
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ profile.name }}</div>
        <div class="ellipsis">{{ profile.email }}</div>
      </div>
    </q-img>>
    <div class="text-h6 q-pt-md">
      Collections
    </div>
    <div v-for="c in collections" :key="c.id" class="q-py-xs">
      <q-btn flat :to="'/' + c.uuid + '/' + c.slug" align="left" style="width: 100%; max-width: 480px" no-wrap>
        <q-avatar>
          <img :src="c.cover" :alt="profile.name">
        </q-avatar>
        <div class="q-pl-md ellipsis">{{ c.title }}</div>
      </q-btn>
    </div>
    <div v-if="collections.length === 0">
      No collections yet.
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
    this.$store.cache.dispatch('collection/getCollections').catch(error => { console.log(error) })
  }
}
</script>
