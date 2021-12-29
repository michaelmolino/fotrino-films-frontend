<template>
  <span v-if="!loading">
    <q-breadcrumbs class="q-ml-md q-mt-lg q-mb-xs text-h6">
      <template v-slot:separator>
        <q-icon size="1.5em" name="chevron_right" color="primary" />
      </template>
      <q-breadcrumbs-el :label="this.collection.title" />
    </q-breadcrumbs>
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
          <q-badge
            style="z-index: 999 !important"
            class="bg-accent q-pa-md"
            align="middle"
            floating
            transparent
          >
            <span class="text-bold">{{ movie.chapters.length }}</span>
          </q-badge>
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
        const movieNode = response.data.movies.sort((a, b) => {
          return a.sort - b.sort
        })
        this.movie = movieNode
        this.collection = response.data

        document.title = this.collection.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.collection.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute('content', this.collection.coverUrl)
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
