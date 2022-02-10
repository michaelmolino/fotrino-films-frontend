<template>
  <div class="q-mt-sm text-center">
    <q-btn
      round
      dense
      color="info"
      icon="link"
      :to="'/' + collection.uuid + '/' + collection.slug + '/' + movie.slug"
    >
      <q-tooltip>Open Movie</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn round dense color="positive" icon="edit" disabled>
      <q-tooltip>Edit Movie</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn
      v-if="!movie.deleted"
      round
      dense
      color="warning"
      icon="delete"
      @click="deleteMovie(collection.uuid, movie.id)"
      disabled
    >
      <q-tooltip>Delete Movie</q-tooltip>
    </q-btn>
    <q-btn
      v-if="movie.deleted"
      round
      dense
      color="positive"
      icon="restore_from_trash"
      @click="unDeleteMovie(collection.uuid, movie.id)"
    >
      <q-tooltip>Restore Movie</q-tooltip>
    </q-btn>
    &nbsp;
    <q-btn
      v-if="movie.deleted"
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
  name: 'ActionBar-Movie',

  props: {
    collection: Object,
    movie: Object
  },

  methods: {
    editMovie (collectionUuid, movieId, deleted) {
      // TODO
    },
    deleteMovie (collectionUuid, movieId) {
      this.editMovie(collectionUuid, movieId, true)
    },
    unDeleteMovie (collectionUuid, movieId) {
      this.editMovie(collectionUuid, movieId, false)
    }
  }
}
</script>
