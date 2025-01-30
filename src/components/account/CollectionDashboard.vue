<template>
  <div>
      <q-card v-if="profile?.id" flat style="width: 100%; max-width: 750px;">
        <q-card-section horizontal>
          <q-card-section>
            <div class="text-h6 text-center">
              <q-icon :name="'fab fa-' + profile.identity_provider" /> {{ profile.name }}
            </div>
            <img :src="profile.profile_pic" :alt="profile.name" class="q-pa-md" />
            <div class="text-subtitle2 text-center">
              <q-icon name="fas fa-inbox" /> {{ profile.email }}
            </div>
          </q-card-section>
          <q-card-section>
            <div class="text-h6 text-center">
              <q-icon name="fas fa-layer-group" /> Collections
            </div>
            <div v-for="c in collections" :key="c.id" class="q-py-xs">
              <q-btn flat :to="'/' + c.uuid + '/' + c.slug">
                <q-avatar>
                  <img :src="c.cover" :alt="profile.name">
                </q-avatar>
                <div class="q-pl-sm">{{ c.title }}</div>
              </q-btn>
            </div>
          </q-card-section>
        </q-card-section>
      </q-card>
    <NothingText v-if="!profile?.id || collections.length === 0" />
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
