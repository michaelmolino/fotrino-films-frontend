<template>
  <div v-if="!loading">
    <span v-if="!playChapter">
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
            @click="playChapter = movie.chapters.find(c => c.id === chapter.id)"
            class="fit"
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
        fab
        square
        label="Home"
        icon="home"
        color="accent"
        class="fixed-bottom-right q-mb-lg q-mr-lg"
        to="/"
      />
    </span>
    <span v-else>
      <div class="row">
        <div class="q-pa-md col-xs-12 col-md-10">
          <h6 class="q-my-xs">{{ playChapter.title }}</h6>
          <q-media-player
            dense
            autoplay
            :show-big-play-button="true"
            type="video"
            :sources="[{ src: playChapter.src, type: playChapter.type }]"
            big-play-button-color="black"
            :playback-rates="[{ label: 'Normal', value: 1 }]"
            style="max-width: 960px;"
          />
          <q-btn
            fab
            square
            label="Back"
            icon="arrow_back"
            color="accent"
            class="fixed-bottom-right q-mb-lg q-mr-lg"
            @click="playChapter = false"
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
      .get(
        'https://fotrino-movies.mocklab.io/movies/' + this.$route.params.movieId
      )
      .then(response => {
        this.movie = response.data
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
