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
    <MovieCover
      class="q-ma-lg"
      :id="movie.id"
      :title="movie.title"
      :subTitle="movie.subTitle"
      :coverUrl="movie.coverUrl"
      :style="
        $q.screen.lt.sm ? 'max-width: 50%;' : 'max-width: 25%; float: left;'
      "
    />
    <div class="row">
      <div
        v-for="chapter in movie.chapters"
        :key="chapter.id"
        class="q-pa-md col-xs-12"
      >
        <span class="q-my-xs">{{ chapter.title }}</span>
        <div style="max-width: 720px">
          <vue-plyr :options="playerOptions">
            <audio controls preload="auto" style="--plyr-color-main: #00635d">
              <source :src="chapter.src" :type="chapter.type" />
              Sorry, your browser doesn't support embedded audio.
            </audio>
          </vue-plyr>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MovieCover from '../components/MovieCover.vue'
import 'vue-plyr/dist/vue-plyr.css'

export default {
  name: 'AudioIndex',
  components: {
    MovieCover
  },
  data () {
    return {
      loading: true,
      collection: null,
      movie: null,
      playerOptions: {
        settings: []
      }
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$axios
      .get('/api/' + this.$route.params.userUuid + '/movies')
      .then((response) => {
        const movieNode = response.data.movies.find(
          (m) => m.id === Number(this.$route.params.audioId)
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
