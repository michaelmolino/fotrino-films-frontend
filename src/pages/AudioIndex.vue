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
          <audio
            class=".js-player"
            controls
            data-plyr-config='{ "settings":  [] }'
            preload="auto"
            style="--plyr-color-main: #00635d"
          >
            <source :src="chapter.src" :type="chapter.type" />
            Sorry, your browser doesn't support embedded audio.
          </audio>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

import Breadcrumbs from '../components/Breadcrumbs.vue'
import MovieCover from '../components/MovieCover.vue'

import { setMetaData, setBreadcrumb } from '../javascript/library.js'

export default {
  name: 'AudioIndex',
  components: {
    MovieCover,
    Breadcrumbs
  },
  data () {
    return {
      metaData: null,
      breadcrumbs: null
    }
  },
  created: function () {
    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: this.$route.params.audioId,
        chapterId: null
      })
      .then(() => {
        this.breadcrumbs = setBreadcrumb(
          this.$route.params.userUuid,
          this.collection,
          this.movie,
          null
        )

        this.metaData = setMetaData(this.movie.title, this.movie.coverUrl)
      })
  },
  updated: function () {
    Array.from(document.getElementsByClassName('.js-player')).map(
      p => new Plyr(p)
    )
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
