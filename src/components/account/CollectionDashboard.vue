<template>
  <div>
    <div v-if="profile.id">
      <div class="text-h6 text-center" style="max-width: 1023px;">
        Dashboard: {{ profile.name + "'s" }} Collections
      </div>
      <div class="q-py-md text-justify" style="max-width: 1023px;">
        <q-icon color="warning" name="warning" size="md" />
        Fotrino Films is under active development and is not ready for use. The
        database, all accounts, and any images, video, etc. are regularly
        deleted. You should have no expectation that this site is fit for any
        purpose.
      </div>
      <q-btn
        color="positive"
        icon="add"
        label="New Collection"
        @click="newCollectionDialog()"
      />
      <div class="row">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="q-pa-md col-xs-6 col-sm-4 col-md-3 col-lg-2"
        >
          <div>
            <CollectionCover
              :style="collection.deleted ? 'filter: brightness(37.5%);' : ''"
              :collection="collection"
              :to="'/dashboard/' + collection.uuid + '/' + collection.slug"
            />
          </div>
          <ActionBarCollection :collection="collection" />
        </div>
      </div>
      <div v-if="collections.length === 0" class="q-py-md">
        No collections yet.
      </div>
    </div>
    <div v-if="!profile.id" class="q-py-md">
      Not logged in!
    </div>
  </div>
</template>

<script>
import { useQuasar } from 'quasar'
import { defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import NewCollection from '@components/account/dialogs/NewCollection.vue'

export default {
  name: 'Collection-Dashboard',

  components: {
    CollectionCover: defineAsyncComponent(() =>
      import('@components/account/CollectionCover.vue')
    ),
    ActionBarCollection: defineAsyncComponent(() =>
      import('@components/account/ActionBar-Collection.vue')
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
  },

  mounted: function() {
    this.$global.$on('editCollection', c => this.newCollectionDialog(c))
  },

  setup() {
    const $q = useQuasar()
    const store = useStore()

    function newCollectionDialog(c) {
      $q.dialog({
        component: NewCollection,
        componentProps: {
          collection: c
        }
      })
        .onOk(data => {
          store.dispatch('collection/getCollections').catch(error => {
            console.log(error)
          })
        })
        .onCancel(() => {
          // Do nothing.
        })
        .onDismiss(() => {
          // Do nothing.
        })
    }

    return { newCollectionDialog }
  }
}
</script>
