<template>
  <div v-if="!loading">
    <span v-if="!playChapter">
      <h6 class="q-ml-xl q-mt-lg q-mb-xs">{{ movie.title }}</h6>
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
            @click="playAChapter(chapter)"
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
        icon="home"
        class="fixed-bottom-right q-mb-lg q-mr-lg"
        to="/"
      />
    </span>
    <span v-else>
      <div class="row">
        <div class="q-pa-md col-xs-12 col-md-10">
          <q-media-player
            dense
            autoplay
            :show-big-play-button="true"
            type="video"
            :sources="[{ src: playChapter.src, type: playChapter.type }]"
            big-play-button-color="black"
            :playback-rates="[{ label: 'Normal', value: 1 }]"
            style="max-width: 960px;"
            :poster="playChapter.previewUrl"
          />
          <h6 class="q-my-xs">{{ playChapter.title }}</h6>
          <q-btn
            square
            size="lg"
            color="secondary"
            icon="arrow_upward"
            class="fixed-bottom-right q-mb-lg q-mr-lg"
            @click="playAChapter(false)"
          />
        </div>
      </div>
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
      movie: null,
      playChapter: false
    }
  },
  created: function () {
    this.$q.loading.show()
    this.$axios
      .get('api/movies/' + this.$route.params.movieId)
      .then(response => {
        this.movie = response.data
        if (this.$route.params.chapterId) {
          this.playAChapter(
            this.movie.chapters.find(
              c => c.id === Number(this.$route.params.chapterId)
            )
          )
        } else {
          this.playAChapter(false)
        }
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
  methods: {
    playAChapter (chapter) {
      if (chapter) {
        this.playChapter = this.movie.chapters.find(c => c.id === chapter.id)
        this.$router
          .push('/movies/' + this.movie.id + '/' + this.playChapter.id)
          .catch(() => true)
        document.title = this.playChapter.title + ' | fotrino-films'
        document
          .querySelector('meta[property="og:title"]')
          .setAttribute('content', this.playChapter.title + ' | fotrino-films')
        document
          .querySelector('meta[property="og:image"]')
          .setAttribute(
            'content',
            'https://films.fotrino.com/8851dec8-c991-4ebf-8a7c-eff8b6d1c94c/' +
              this.playChapter.previewUrl
          )
      } else {
        this.playChapter = false
        this.$router.push('/movies/' + this.movie.id)
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
      }
    }
  },
  watch: {
    $route: function (value) {
      if (value.params.chapterId) {
        this.playAChapter(
          this.movie.chapters.find(
            c => c.id === Number(this.$route.params.chapterId)
          )
        )
      } else {
        this.playAChapter(false)
      }
    }
  }
}
</script>
