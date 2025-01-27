<template>
  <div>
    <div v-if="profile.id">
      <div v-for="c in collections" :key="c.id" class="q-py-xs">
        <q-btn flat :to="'/' + c.uuid + '/' + c.slug">
          <q-avatar>
            <img :src="c.cover">
          </q-avatar>
          <div class="q-pl-sm">{{ c.title }}</div>
        </q-btn>
      </div>
    </div>
    <NothingText v-if="!profile.id || collections.length === 0" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'Collection-Dashboard',

  components: {
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

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
