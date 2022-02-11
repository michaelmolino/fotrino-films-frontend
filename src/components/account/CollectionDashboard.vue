<template>
  <div>
    <div v-if="profile.id">
      <div class="text-h6 text-center">Dashboard: {{ profile.name + '\'s' }} Collections</div>
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
              <CollectionCover :collection="collection" :to="'/dashboard/movies?uuid=' + collection.uuid" />
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
      get () {
        return this.$store.state.account.profile
      }
    },
    collections: {
      get () {
        return this.$store.state.collection.collections
      }
    }
  },

  created: function () {
    this.$store.dispatch('collection/fetchCollections')
      .catch(error => {
        console.log(error)
      })
  },

  setup () {
    const $q = useQuasar()

    function newCollectionDialog () {
      $q.dialog({
        component: NewCollection
      })
        .onOk(data => {
          console.log(data)
        })
        .onCancel(() => {
          // TODO: Cleanup uploaded file
        })
        .onDismiss(() => {
          // Do nothing.
        })
    }

    return { newCollectionDialog }
  }
}
</script>
