<template>
  <div v-if="movie">

    <BreadCrumbs
      :collection="collection"
      :movie="movie"
      :chapter="chapter.main ? this.$nullChapter : chapter"
      :private="$route.params.privateId ? true : false"
    />

    <NothingText v-if="movie.chapters?.length === 0" />

    <span v-else>
      <PlyrPlayer :chapter="chapter" style="width: 100%; max-width: 720px; min-width: 240px;" class="q-py-md" />

      <ChapterDescription :chapter="chapter" />

      <span v-if="$route.params.uuid && movie.chapters?.filter(ch => ch.id !== chapter.id)?.length > 0">
        <div class="q-pt-md text-h6">
          Related Content
        </div>
        <div class="row">
          <div
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
            v-for="chapter in movie.chapters?.filter(ch => ch.id !== chapter.id)"
            :key="chapter.id"
          >
            <ChapterPreview
              :style="chapter.deleted ? 'filter: brightness(37.5%); max-width: 360px;' : 'max-width: 360px;'"
              :collection="collection"
              :movie="movie"
              :chapter="chapter"
              :to="'/' + collection.uuid + '/' + collection.slug + '/' + movie.slug + '/' + chapter.slug"
            />
          </div>
        </div>
      </span>
    </span>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'MovieRoot',

  components: {
    BreadCrumbs: defineAsyncComponent(() =>
      import('@components/collection/BreadCrumbs.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    ),
    PlyrPlayer: defineAsyncComponent(() =>
      import('@components/collection/PlyrPlayer.vue')
    ),
    ChapterDescription: defineAsyncComponent(() =>
      import('@components/collection/ChapterDescription.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
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
        if (this.$route.params.uuid) {
          _movie = this.collection.movies.find(
            m => m.slug === this.$route.params.movieSlug
          )
          if (this.collection.id && this.$route.params.movieSlug && !_movie) {
            this.$router.replace('/404')
          }
        } else if (this.$route.params.privateId) {
          _movie = this.collection.movie
        }
        return _movie
      }
    },
    chapter: {
      get() {
        let _chapter = null
        if (this.$route.params.uuid) {
          if (this.$route.params.chapterSlug) {
            _chapter = this.movie?.chapters.find(
              ch => ch.slug === this.$route.params.chapterSlug
            )
          } else if (!this.$route.params.chapterSlug) {
            _chapter = this.movie?.chapters.find(ch => ch.main) || this.movie?.chapters[0]
            this.$router.replace({
              params: { chapterSlug: _chapter.slug }
            })
          }
          if (this.collection.id && !_chapter) {
            this.$router.replace('/404')
          }
        } else if (this.$route.params.privateId) {
          _chapter = this.collection.movie.chapter
        }
        return _chapter
      }
    }
  }

}
</script>
