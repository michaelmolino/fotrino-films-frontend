<template>
  <div v-if="chapter">
    <Breadcrumbs :collection="collection" :movie="movie" :chapter="chapter" />
    <div style="max-width: 640px" class="q-pa-md">
      <Vime :chapter="chapter" :options="options={}" />
    </div>
    <div class="q-py-md" v-html="chapter.description_sanitised"></div>
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
    Vime: defineAsyncComponent(() =>
      import('@components/collection/Vime.vue')
    )
  },

  computed: {
    collection: {
      get() {
        return this.$store.state.collection.collection
      }
    },
    movie: {
      get() {
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
      get() {
        let _chapter = null
        _chapter = this.movie?.chapters.find(
          ch => ch.slug === this.$route.params.chapterSlug
        )
        if (_chapter?.main) {
          this.$router.replace('/' + this.collection.uuid + '/' + this.collection.slug + '/' + this.movie.slug)
        }
        if (_chapter?.deleted) {
          this.$q.notify({
            type: 'info',
            timeout: 0,
            message: 'This chapter has been deleted. Only you can see it.',
            icon: 'info',
            multiLine: false,
            actions: [
              {
                label: 'Dismiss',
                color: 'white'
              }
            ]
          })
        }
        if (this.collection.uuid && !_chapter) {
          this.$router.replace('/404')
        }
        return _chapter
      }
    }
  }
}
</script>
