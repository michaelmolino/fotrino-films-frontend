<template>
  <div v-if="!loading">
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
        <h6 class="q-my-xs">{{ chapter.title }}</h6>
        <vue-plyr
          style="max-width: 960px; --plyr-color-main: #00635D;"
          :options="playerOptions"
        >
          <audio controls preload="auto" style="--plyr-color-main: #00635D;">
            <source :src="chapter.src" :type="chapter.type" />
            Sorry, your browser doesn't support embedded audio.
          </audio>
        </vue-plyr>
        <q-btn
          square
          size="lg"
          color="secondary"
          icon="arrow_upward"
          class="fixed-bottom-right q-mb-lg q-mr-lg"
          to="/"
        />
      </div>
    </div>
  </div>
</template>

<script>
import MovieCover from '../components/MovieCover.vue'

export default {
  name: 'AudioIndex',
  components: {
    MovieCover
  },
  data () {
    return {
      loading: true,
      movie: null,
      playerOptions: {
        settings: []
      }
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$axios
      .get('api/movies/' + this.$route.params.audioId)
      .then(response => {
        this.movie = response.data
        document.title = this.movie.title + ' | fotrino-films'

        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.movie.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute(
            'content',
            'https://films.fotrino.com/8851dec8-c991-4ebf-8a7c-eff8b6d1c94c/' +
              this.movie.coverUrl
          )

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
  },
  methods: {},
  watch: {}
}
</script>
