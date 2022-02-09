<template>
  <div v-if="collection.uuid">
    <Breadcrumbs :collection="collection" :movie="this.$nullMovie" :chapter="this.$nullChapter" />
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="movie in collection.movies"
        :key="movie.id"
      >
        <MovieCover
          :movie="movie"
          :to="'/' + collection.uuid + '/' + collection.slug + '/' + movie.slug"
        />
      </div>
      <div v-if="collection.movies.length === 0">
        This collection is empty!
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'Collection-Root',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    MovieCover: defineAsyncComponent(() =>
      import('@components/collection/MovieCover.vue')
    )
  },

  computed: {
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    }
  }
}
</script>
