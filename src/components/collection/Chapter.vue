<template>
  <div v-if="chapter">
    <Breadcrumbs :collection="collection" :movie="movie" :chapter="chapter" />
    <video-player
      style="max-width: 720px"
      class="q-mt-md"
      :type="chapter.type"
      :options="{
        autoplay: !!$route.query.fbclid,
        controls: true,
        controlBar: {
          pictureInPictureToggle: false,
          captionsButton: false,
          fullscreenToggle: chapter.type.startsWith('audio/') ? false : true
        },
        fluid: true,
        responsive: true,
        poster: chapter.preview,
        sources: [
          {
            src: chapter.src,
            type: chapter.type
          }
        ]
      }"
    />
    <div class="q-py-md" v-html="chapter.description"></div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'Chapter-Player',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    VideoPlayer: defineAsyncComponent(() =>
      import('@components/collection/VideoPlayer.vue')
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
        let _movie = null
        _movie = this.collection.movies.find(
          m => m.slug === this.$route.params.movieSlug
        )
        if (this.collection.uuid && !_movie) {
          this.$router.replace('/404')
        }
        return _movie
      }
    },
    chapter: {
      get () {
        let _chapter = null
        _chapter = this.movie?.chapters.find(
          ch => ch.slug === this.$route.params.chapterSlug
        )
        if (this.collection.uuid && !_chapter) {
          this.$router.replace('/404')
        }
        return _chapter
      }
    }
  }
}
</script>
