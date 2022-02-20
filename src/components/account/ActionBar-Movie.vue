<template>
  <div class="q-mt-sm text-center">
    <ActionButtonOpenMovie :collection="collection" :movie="movie" />
    &nbsp;
    <q-btn round dense color="positive" icon="edit" disable>
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
      disable
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
      disable
    >
      <q-tooltip>Delete Forever</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'ActionBar-Movie',

  components: {
    ActionButtonOpenMovie: defineAsyncComponent(() =>
      import('@components/account/ActionButtonOpen-Movie.vue')
    )
  },

  props: {
    collection: Object,
    movie: Object
  },

  methods: {
    editMovie(collectionUuid, movieId, deleted) {
      console.log('Not yet supported.')
    },
    deleteMovie(collectionUuid, movieId) {
      this.editMovie(collectionUuid, movieId, true)
    },
    unDeleteMovie(collectionUuid, movieId) {
      this.editMovie(collectionUuid, movieId, false)
    }
  }
}
</script>
