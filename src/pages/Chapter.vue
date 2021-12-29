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
      <q-breadcrumbs-el
        :label="movie.title"
        :to="'/' + $route.params.userUuid + '/movies/' + $route.params.movieId"
      />
      <q-breadcrumbs-el :label="chapter.title" />
    </q-breadcrumbs>
    <div class="row">
      <div class="q-pa-md col-xs-12">
        <video-player
          style="max-width: 720px"
          :options="{
            autoplay: false,
            controls: true,
            controlBar: {
              pictureInPictureToggle: false
            },
            fluid: true,
            responsive: true,
            poster: chapter.previewUrl,
            sources: [
              {
                src: chapter.src,
                type: chapter.type
              }
            ]
          }"
        />
        <div
          class="q-pt-md q-pl-md text-body"
          v-html="chapter.description"
        ></div>
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
      collection: null,
      movie: null,
      chapter: null
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$axios
      .get('/api/' + this.$route.params.userUuid + '/movies')
      .then((response) => {
        this.collection = response.data
        this.movie = response.data.movies.find(
          (m) => m.id === Number(this.$route.params.movieId)
        )
        this.chapter = this.movie.chapters.find(
          (ch) => ch.id === Number(this.$route.params.chapterId)
        )

        document.title = this.chapter.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.chapter.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute('content', this.chapter.previewUrl)
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
