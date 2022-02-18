<template>
  <div>
    <div v-if="profile.id">
      <div class="text-h6 text-center">
        <q-btn flat dense icon="arrow_back" to="/dashboard" />
        Dashboard: {{ collection.title }}
        <ActionButtonOpenCollection :collection="collection" />
      </div>
      <q-btn
        color="positive"
        icon="add"
        label="New Movie"
        @click="newMovieDialog()"
      />
      <div class="row">
        <div
          v-for="movie in collection.movies"
          :key="movie.id"
          class="q-pa-md col-xs-6 col-sm-4 col-md-3 col-lg-2"
        >
          <div>
            <MoviePoster :collection="collection" :movie="movie" :to="'/dashboard/' + collection.uuid + '/' + collection.slug + '/' + movie.slug" />
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
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

import NewMovie from '@components/account/dialogs/NewMovie.vue'

export default {
  name: 'Movie-Dashboard',

  components: {
    ActionButtonOpenCollection: defineAsyncComponent(() =>
      import('@components/account/ActionButtonOpen-Collection.vue')
    ),
    MoviePoster: defineAsyncComponent(() =>
      import('@components/collection/MoviePoster.vue')
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

  setup () {
    const $q = useQuasar()
    const store = useStore()
    const route = useRoute()

    function newMovieDialog () {
      $q.dialog({
        component: NewMovie
      })
        .onOk(data => {
          store
            .dispatch('collection/getCollection',
              route.params.uuid)
            .catch(error => {
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

    return { newMovieDialog }
  }
}
</script>
