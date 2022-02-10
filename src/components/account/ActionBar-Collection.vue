<template>
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
    <q-btn round dense color="positive" icon="edit" disabled>
      <q-tooltip>Edit Collection</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn
      v-if="!collection.deleted"
      round
      dense
      color="warning"
      icon="delete"
      @click="deleteCollection(collection.uuid)"
    >
      <q-tooltip>Delete Collection</q-tooltip>
    </q-btn>
    <q-btn
      v-if="collection.deleted"
      round
      dense
      color="positive"
      icon="restore_from_trash"
      @click="unDeleteCollection(collection.uuid)"
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
</template>

<script>
export default {
  name: 'ActionBar-Collection',

  props: {
    collection: Object
  },

  methods: {
    editCollection (collectionUuid, deleted) {
      this.$store
        .dispatch('collection/editCollection', {
          uuid: collectionUuid,
          deleted: deleted
        })
        .then(() => {
          this.$store.dispatch('collection/fetchCollections')
          this.$store.cache.delete('collection/fetchCollection', collectionUuid)
        })
    },
    deleteCollection (collectionUuid) {
      this.editCollection(collectionUuid, true)
    },
    unDeleteCollection (collectionUuid) {
      this.editCollection(collectionUuid, false)
    }
  }
}
</script>
