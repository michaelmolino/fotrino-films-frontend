<template>
  <span v-if="!loading">
    <h6 class="q-ml-md q-mt-lg q-mb-xs">{{ this.collection.title }}</h6>
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="movie in collection.movies"
        :key="movie.id"
      >
        <q-btn
          flat
          dense
          no-caps
          :to="
            '/' +
            $route.params.userUuid +
            '/' +
            movie.mediaType +
            '/' +
            movie.id
          "
          class="fit"
          padding="16px"
        >
          <MovieCover
            :id="movie.id"
            :title="movie.title"
            :subTitle="movie.subTitle"
            :coverUrl="movie.coverUrl"
          />
        </q-btn>
      </div>
    </div>
  </span>
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
      collection: null
    }
  },
  created: function () {
    this.$q.loading.show()
    this.$axios
      .get('/api/' + this.$route.params.userUuid + '/movies')
      .then((response) => {
        this.collection = response.data
        document.title = this.collection.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.collection.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute('content', null)
        this.loading = false
        this.$q.loading.hide()
      })
      .catch((error) => {
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
