<template>
  <div v-if="chapter">
    <Breadcrumbs
      :userUuid="$route.params.userUuid"
      :collection="collection"
      :movie="movie"
      :chapter="chapter"
    />
    <div class="row">
      <div class="q-pa-md col-xs-12">
        <video-player
          style="max-width: 720px"
          :options="{
            autoplay: !!$route.query.fbclid,
            controls: true,
            controlBar: {
              pictureInPictureToggle: false,
              captionsButton: false
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
import { useMeta } from 'quasar'
import { ref, defineAsyncComponent } from 'vue'

import { setMetaData } from '../../javascript/library.js'

export default {
  name: 'Chapter',
  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('../../components/Breadcrumbs.vue')
    ),
    VideoPlayer: defineAsyncComponent(() =>
      import('../../components/VideoPlayer.vue')
    )
  },
  data () {
    return {
      movie: null,
      chapter: null
    }
  },
  created: function () {
    this.$store.cache
      .dispatch('collection/fetchCollection', this.$route.params.userUuid)
      .then(() => {
        this.movie = this.collection.movies.find(
          m => m.id === Number(this.$route.params.movieId)
        )
        this.chapter = this.movie.chapters.find(
          ch => ch.id === Number(this.$route.params.chapterId)
        )
        this.metaData = setMetaData(this.chapter.title, this.chapter.previewUrl)
      })
  },
  computed: {
    collection: {
      get () {
        return this.$store.state.collection.collection
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
