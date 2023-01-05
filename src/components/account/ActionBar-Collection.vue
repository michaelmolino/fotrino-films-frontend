<template>
  <div class="q-mt-sm text-center">
    <ActionButtonOpenCollection :collection="collection" />
    &nbsp;
    <q-btn
      round
      dense
      color="positive"
      icon="edit"
      @click="editCollection(collection)"
    >
      <q-tooltip>Edit Collection</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn
      disable
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
      disable
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
      disable
    >
      <q-tooltip>Delete Forever</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'ActionBar-Collection',

  components: {
    ActionButtonOpenCollection: defineAsyncComponent(() =>
      import('@components/account/ActionButtonOpen-Collection.vue')
    )
  },

  props: {
    collection: Object
  },

  methods: {
    editCollection(_collection) {
      this.$global.$emit('editCollection', _collection)
    },
    deleteCollection(collectionUuid) {
      this.editCollection({ uuid: collectionUuid, deleted: true })
    },
    unDeleteCollection(collectionUuid) {
      this.editCollection({ uuid: collectionUuid, deleted: false })
    }
  }
}
</script>
