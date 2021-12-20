<template>
  <div v-if="!loading">
    <h6 v-if="!$q.platform.is.mobile" class="q-ml-md q-mt-lg q-mb-xs">
      {{ movie.parentTitle }} > {{ movie.title }}
    </h6>
    <h6 v-if="$q.platform.is.mobile" class="q-ml-md q-mt-lg q-mb-xs">
      {{ movie.parentTitle }}<br />
      {{ movie.title }}<br />
    </h6>
    <div class="row">
      <div class="q-pa-md col-xs-12">
        <video-player
          style="max-width: 720px"
          :options="{
            autoplay: false,
            controls: true,
            fluid: true,
            responsive: true,
            poster: playChapter.previewUrl,
            sources: [
              {
                src: playChapter.src,
                type: playChapter.type
              }
            ]
          }"
        />
        <h4 class="q-ml-md q-mt-lg q-mb-xs">
          {{ playChapter.title }}
        </h4>

        <q-btn
          square
          size="lg"
          color="secondary"
          icon="arrow_upward"
          class="fixed-bottom-right q-mb-lg q-mr-lg"
          :to="
            '/' + $route.params.userUuid + '/movies/' + $route.params.movieId
          "
        />
      </div>
    </div>
  </div>
</template>

<script>
import VideoPlayer from '../components/VideoPlayer.vue'

export default {
  name: 'Chapter',
  components: {
    VideoPlayer
  },
  data () {
    return {
      loading: true,
      movie: null,
      playChapter: false
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$axios
      .get(
        '/api/' +
          this.$route.params.userUuid +
          '/movies/' +
          this.$route.params.movieId
      )
      .then((response) => {
        this.movie = response.data
        this.playChapter = this.movie.chapters.find(
          (ch) => ch.id === Number(this.$route.params.chapterId)
        )
        document.title = this.playChapter.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.playChapter.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute('content', this.playChapter.previewUrl)
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
