<template>
  <div v-if="movie">
    <Breadcrumbs
      :userUuid="$route.params.userUuid"
      :collection="collection"
      :movie="movie"
      :chapter="null"
    />
    <div
      v-for="chapter in movie.chapters"
      :key="chapter.id"
      class="row q-ml-lg q-pa-md"
      style="max-width: 720px"
    >
      <div class="q-my-xs col-xs-12">
        <span class="q-my-xs text-body text-bold ellipsis">{{
          chapter.title
        }}</span>
        <audio
          class=".js-player"
          controls
          data-plyr-config='{ "settings":  [] }'
          preload="auto"
          style="--plyr-color-main: #8D6A9F"
        >
          <source :src="chapter.src" :type="chapter.type" />
          Sorry, your browser doesn't support embedded audio.
        </audio>
      </div>
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { ref, defineAsyncComponent } from 'vue'

import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

import { setMetaData } from '../javascript/library.js'

export default {
  name: 'AudioIndex',
  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('../components/Breadcrumbs.vue')
    )
  },
  created: function () {
    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: this.$route.params.audioId,
        chapterId: null
      })
      .then(() => {
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
  setup () {
    const metaData = ref(setMetaData(null, null))
    useMeta(() => {
      return metaData.value
    })
    return {
      metaData
    }
  }
}
</script>

<style lang="sass">
:root
  --plyr-audio-controls-background: $dark
  --plyr-audio-control-color: $dark
  // --plyr-color-main: $accent
</style>
