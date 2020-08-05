<template>
  <div class="row" v-if="!loading">
    <div
      class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
      v-for="movie in movies"
      :key="movie.id"
    >
      <q-btn flat dense no-caps :to="'/movies/' + movie.id" class="fit">
        <MovieCover
          :id="movie.id"
          :title="movie.title"
          :subTitle="movie.subTitle"
          :coverUrl="movie.coverUrl"
        />
      </q-btn>
    </div>
  </div>
</template>

<script>
import MovieCover from '../components/MovieCover.vue'

export default {
  name: 'MovieIndex',
  components: {
    MovieCover
  },
  data () {
    return {
      loading: true,
      movies: null
    }
  },
  created: function () {
    this.$q.loading.show()
    this.$axios
      .get('https://fotrino-movies.mocklab.io/movies')
      .then(response => {
        this.movies = response.data
        this.loading = false
        this.$q.loading.hide()
      })
      .catch(error => {
        this.loading = false
        this.$q.loading.hide()
        this.$q.notify({
          type: 'negative',
          message: error.response.data,
          icon: 'warning',
          multiLine: true
        })
      })
  }
}
</script>
