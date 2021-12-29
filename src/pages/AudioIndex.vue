<template>
  <div v-if="movie">
    <Breadcrumbs :breadcrumbs="this.breadcrumbs" />
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
import Breadcrumbs from '../components/Breadcrumbs.vue'
import MovieCover from '../components/MovieCover.vue'

import Vue from 'vue'
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'
Vue.use(VuePlyr)

export default {
  name: 'AudioIndex',
  components: {
    MovieCover,
    Breadcrumbs
  },
  data () {
    return {
      metaData: null,
      breadcrumbs: null,
      playerOptions: {
        settings: []
      }
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: this.$route.params.audioId,
        chapterId: null
      })
      .then(() => {
        this.breadcrumbs = [
          {
            id: 0,
            label: this.collection.title,
            to: '/' + this.$route.params.userUuid
          },
          { id: 1, label: this.movie.title, to: null }
        ]

        this.metaData = {
          title: this.movie.title + ' | fotrino-films',
          meta: {
            ogTitle: {
              property: 'og:title',
              content: this.movie.title + ' | fotrino-films'
            },
            ogImage: { name: 'og:image', content: this.movie.coverUrl }
          }
        }
        this.$q.loading.hide()
      })
  },
  computed: {
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    },
    movie: {
      get () {
        return this.$store.state.collection.movie
      }
    }
  },
  meta () {
    return this.metaData
  }
}
</script>
