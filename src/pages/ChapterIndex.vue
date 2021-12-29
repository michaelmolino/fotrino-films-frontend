<template>
  <div v-if="!loading">
    <q-breadcrumbs class="q-ml-md q-mt-lg q-mb-xs text-h6">
      <template v-slot:separator>
        <q-icon size="1.5em" name="chevron_right" color="primary" />
      </template>
      <q-breadcrumbs-el
        :label="collection.title"
        :to="'/' + $route.params.userUuid"
      />
      <q-breadcrumbs-el :label="movie.title" />
    </q-breadcrumbs>
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="chapter in movie.chapters"
        :key="chapter.id"
      >
        <div :class="chapter.primary ? 'bg-accent' : ''">
          <q-btn
            flat
            dense
            no-caps
            :to="
              '/' +
              $route.params.userUuid +
              '/' +
              'movies' +
              '/' +
              movie.id +
              '/' +
              chapter.id
            "
            class="fit"
            padding="8px"
          >
            <ChapterPreview
              class="cursor-pointer"
              :id="chapter.id"
              :title="chapter.title"
              :previewUrl="chapter.previewUrl"
            />
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChapterPreview from '../components/ChapterPreview.vue'

export default {
  name: 'ChapterIndex',
  components: {
    ChapterPreview
  },
  data () {
    return {
      loading: true,
      collection: null,
      movie: null
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$axios
      .get('/api/' + this.$route.params.userUuid + '/movies')
      .then((response) => {
        const movieNode = response.data.movies.find(
          (m) => m.id === Number(this.$route.params.movieId)
        )
        movieNode.chapters = movieNode.chapters.sort((a, b) => {
          return a.sort - b.sort
        })
        this.movie = movieNode
        this.collection = response.data

        document.title = this.movie.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.movie.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute('content', this.movie.coverUrl)
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
  },
  methods: {},
  watch: {}
}
</script>
