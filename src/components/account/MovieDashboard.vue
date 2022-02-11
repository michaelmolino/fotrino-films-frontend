<template>
  <div>
    <div v-if="profile.id">
      <div class="text-h6 text-center">
        <q-btn flat dense icon="arrow_back" to="/dashboard" />
        Dashboard: {{ collection.title }}
      </div>
      <q-btn color="positive" icon="add" label="New Movie" @click="newMovieDialog()" />
      <div class="row">
        <div
          v-for="movie in collection.movies"
          :key="movie.id"
          class="q-pa-md col-xs-6 col-sm-4 col-md-3 col-lg-2"
        >
          <div>
            <MovieCover :collection="collection" :movie="movie" disabled />
          </div>
          <ActionBarMovie :collection="collection" :movie="movie" />
        </div>
      </div>
      <div v-if="collection.movies.length === 0" class="q-py-md">
        No movies yet.
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

import NewMovie from '@components/account/dialogs/NewMovie.vue'

export default {
  name: 'Movie-Dashboard',

  components: {
    MovieCover: defineAsyncComponent(() =>
      import('@components/collection/MovieCover.vue')
    ),
    ActionBarMovie: defineAsyncComponent(() =>
      import('@components/account/ActionBar-Movie.vue')
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
    this.$store
      .dispatch('collection/fetchCollection', this.$route.query.uuid)
      .catch(error => {
        console.log(error)
      })
  },

  setup () {
    const $q = useQuasar()

    function newMovieDialog () {
      $q.dialog({
        component: NewMovie
      })
        .onOk(data => {
          console.log(data)
          $q.notify({
            type: 'warning',
            timeout: 0,
            message: 'Not implemented.',
            icon: 'warning',
            multiLine: false,
            actions: [
              {
                label: 'Dismiss',
                color: 'black'
              }
            ]
          })
        })
        .onCancel(() => {
          // TODO: Cleanup uploaded file
        })
        .onDismiss(() => {
          // Do nothing.
        })
    }

    return { newMovieDialog }
  }
}
</script>
