<template>
  <div v-if="movie">
    <Breadcrumbs
      :collection="collection"
      :movie="movie"
      :chapter="this.$nullChapter"
    />
    <div class="q-pa-md">
      <div
        style="max-width: 640px"
        v-for="chapter in movie.chapters.filter(chapter => chapter.main).slice(0)"
        :key="chapter.id"
      >

      <Vime :chapter="chapter" :options="options={}" />
      <div class="q-py-md" v-html="chapter.description_sanitised"></div>
        </div>
      </div>

    <div>
      <div class="row" v-if="movie.chapters.filter(chapter => !chapter.main).length > 0">
        <div class="text-h6">Bonus Features</div>
      </div>
      <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="chapter in movie.chapters.filter(chapter => !chapter.main)"
        :key="chapter.id"
      >
        <ChapterPreview v-if="!chapter.main"
          :style="chapter.deleted ? 'filter: brightness(37.5%);' : ''"
          :collection="collection"
          :movie="movie"
          :chapter="chapter"
          :to="
            '/' +
              collection.uuid +
              '/' +
              collection.slug +
              '/' +
              movie.slug +
              '/' +
              chapter.slug
          "
        />
      </div>
      </div>
    </div>

    <div class="row">
    <div v-if="movie.chapters.length === 0">
        This movie is empty!
      </div>
    </div>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'ChapterIndex',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
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
    }
  }
}
</script>
