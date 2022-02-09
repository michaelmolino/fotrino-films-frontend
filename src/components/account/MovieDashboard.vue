<template>
  <div v-if="collection">
    <div v-if="profile">
      <div class="text-h6 text-center">
        <q-btn flat dense icon="arrow_back" to="/dashboard" />
        Dashboard:
        {{ collection.title }}
      </div>
      <div>
        <q-btn color="positive" icon="add" label="New Movie" disabled />
      </div>

      <div class="row">
        <div
          v-for="movie in collection.movies"
          :key="movie.id"
          class="q-pa-md col-xs-6 col-sm-4 col-md-3 col-lg-2"
          style="max-width: 320px"
        >
          <MovieCover :movie="movie" disabled />
        </div>
      </div>
    </div>
    <div v-if="!profile">
      Not logged in!
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'Movie-Dashboard',

  components: {
    MovieCover: defineAsyncComponent(() =>
      import('@components/collection/MovieCover.vue')
    )
  },

  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    },
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    }
  },

  created: function () {
    this.$store.dispatch('collection/fetchCollection', this.$route.query.uuid)
  }
}
</script>
