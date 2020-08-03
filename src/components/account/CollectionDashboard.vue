<template>
  <div>
    <div class="text-h6 text-center">Dashboard: Collections</div>
    <div v-if="profile.id">
      <q-btn
        color="positive"
        icon="add"
        label="New Collection"
        @click="openNewCollectionDialog()"
      />
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="q-pa-md col-xs-6 col-sm-4 col-md-3 col-lg-2"
        style="max-width: 320px"
      >
          <div>
            <CollectionCover :collection="collection" :to="'/dashboard/movies?uuid=' + collection.uuid" />
          </div>
          <div class="q-mt-sm text-center">
            <q-btn
              round
              dense
              color="info"
              icon="link"
              :to="'/' + collection.uuid + '/' + collection.slug"
            >
              <q-tooltip>Open Collection</q-tooltip>
            </q-btn>
            &nbsp;
            <q-btn
              round
              dense
              color="positive"
              icon="edit"
              @click="openEditCollectionDialog(collection.id)"
            >
              <q-tooltip>Edit Collection</q-tooltip>
            </q-btn>
            &nbsp;
            <q-btn round dense color="warning" icon="sync" disabled>
              <q-tooltip>Refresh UUID</q-tooltip>
            </q-btn>
            &nbsp;
            <q-btn
              v-if="!collection.deleted"
              round
              dense
              color="warning"
              icon="delete"
              @click="activeCollection=collection; editCollection(collection.title, true)"
            >
              <q-tooltip>Delete Collection</q-tooltip>
            </q-btn>
            <q-btn
              v-if="collection.deleted"
              round
              dense
              color="positive"
              icon="restore_from_trash"
              @click="activeCollection=collection; editCollection(collection.title, false)"
            >
              <q-tooltip>Restore Collection</q-tooltip>
            </q-btn>
            &nbsp;
            <q-btn
              v-if="collection.deleted"
              round
              dense
              color="negative"
              icon="delete_forever"
              disabled
            >
              <q-tooltip>Delete Forever</q-tooltip>
            </q-btn>
          </div>
      </div>
      <div v-if="collections.length === 0" class="q-py-md">
        No collections yet.
      </div>
    </div>
    <div v-if="!profile.id" class="q-py-md">
      Not logged in!
    </div>

    <!-- DIALOGS -->
    <!-- New Collection -->
    <q-dialog v-model="newCollectionDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Collection Title</div>
        </q-card-section>

        <q-card-section>
          <q-input
            :color="$q.dark.isActive ? 'white' : 'primary'"
            dense
            v-model="collectionTitle"
            autofocus
            @keyup.enter="prompt = false"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn
            :color="$q.dark.isActive ? 'white' : 'primary'"
            flat
            label="Cancel"
            v-close-popup
          />
          <q-btn
            :color="$q.dark.isActive ? 'white' : 'primary'"
            flat
            icon="video_library"
            label="New Collection"
            v-close-popup
            @click="createCollection(collectionTitle)"
            :disabled="!collectionTitle"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Collection -->
    <q-dialog v-model="editCollectionDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Collection Title</div>
        </q-card-section>

        <q-card-section>
          <q-input
            :color="$q.dark.isActive ? 'white' : 'primary'"
            dense
            v-model="collectionTitle"
            autofocus
            @keyup.enter="prompt = false"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn
            :color="$q.dark.isActive ? 'white' : 'primary'"
            flat
            label="Cancel"
            v-close-popup
          />
          <q-btn
            :color="$q.dark.isActive ? 'white' : 'primary'"
            flat
            icon="movie"
            label="Save"
            v-close-popup
            @click="editCollection(collectionTitle)"
            :disabled="!collectionTitle"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineAsyncComponent, ref } from 'vue'

export default {
  name: 'Collection Dashboard',

  components: {
    CollectionCover: defineAsyncComponent(() =>
      import('@components/collection/CollectionCover.vue')
    )
  },

  data () {
    return {
      activeCollection: null
    }
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
      .catch(() => {})
  },

  setup () {
    return {
      newCollectionDialog: ref(false),
      editCollectionDialog: ref(false),
      collectionTitle: ref('')
    }
  },

  methods: {
    openEditCollectionDialog (id) {
      this.activeCollection = this.collections.find(c => c.id === id)
      this.collectionTitle = this.activeCollection.title
      this.editCollectionDialog = true
    },
    openNewCollectionDialog () {
      this.collectionTitle = null
      this.newCollectionDialog = true
    },
    createCollection (title) {
      this.$store
        .dispatch('collection/createCollection', { title: title })
        .then(() => {
          this.$store
            .dispatch('collection/fetchCollections')
        })
    },
    editCollection (title, deleted) {
      if (deleted === undefined) {
        deleted = this.activeCollection.deleted
      }
      const collection = this.activeCollection
      this.$store
        .dispatch('collection/editCollection', { uuid: collection.uuid, title: title, deleted: deleted })
        .then(() => {
          this.$store
            .dispatch('collection/fetchCollections')
        })
    }
  }
}
</script>
