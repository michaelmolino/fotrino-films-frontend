<template>
  <div v-if="!loading">
    <h6 v-if="!$q.platform.is.mobile" class="q-ml-md q-mt-lg q-mb-xs">
      {{ movie.parentTitle }} > {{ movie.title }}
    </h6>
    <h6 v-if="$q.platform.is.mobile" class="q-ml-md q-mt-lg q-mb-xs">
      {{ movie.parentTitle }}<br />
      {{ movie.title }}
    </h6>
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="chapter in movie.chapters"
        :key="chapter.id"
      >
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
    <q-btn
      square
      size="lg"
      color="secondary"
      icon="arrow_upward"
      class="fixed-bottom-right q-mb-lg q-mr-lg"
      :to="'/' + $route.params.userUuid"
    />
    <span v-if="movie.chapters.length == 0">
      <h4 class="q-ml-xl q-mt-lg q-mb-xs">Nothing here... yet!</h4>
    </span>
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
      movie: null
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
        document.title = this.movie.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.movie.title + ' | fotrino-films')
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
  },
  methods: {},
  watch: {}
}
</script>
