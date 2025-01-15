<template>
  <div v-if="collection.uuid">

    <div class="row q-py-md">
      <Breadcrumbs
        :collection="collection"
        :movie="this.$nullMovie"
        :chapter="this.$nullChapter"
      />

      <q-space />

      <q-btn-toggle
        v-model="selectedView"
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
          {label: 'Collections', value: 'collections'},
          {label: 'All Media', value: 'all'}
        ]"
      />
  </div>

    <div class="row" v-if="selectedView=='collections'">
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="movie in collection.movies"
        :key="movie.id"
      >
        <MoviePoster
          :style="movie.deleted ? 'max-width: 480px; filter: brightness(37.5%);' : 'max-width: 480px'"
          :movie="movie"
          :to="'/' + collection.uuid + '/' + collection.slug + '/' + movie.slug"
        />
      </div>

      <div v-if="collection.movies.length === 0">
        This collection is empty!
      </div>
    </div>

    <div class="row" v-if="selectedView=='all'">
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm"
        v-for="item in collection.movies.flatMap(movie => movie.chapters.map(chapter => ({ chapter: chapter, movie: movie })))"
        :key="item.chapter.id"
      >
      <ChapterPreview
          :style="item.chapter.deleted ? 'filter: brightness(37.5%); max-width: 360px;' : 'max-width: 360px;'"
          :collection="collection"
          :movie="item.movie"
          :chapter="item.chapter"
          :to="'/' + collection.uuid + '/' + collection.slug + '/' + item.movie.slug + '/' + item.chapter.slug"
          :detail=true
        />
      </div>
    </div>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'Collection-Root',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    MoviePoster: defineAsyncComponent(() =>
      import('@components/collection/MoviePoster.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    )
  },

  data() {
    return {
      selectedView: 'collections'
    }
  },

  computed: {
    collection: {
      get() {
        return this.$store.state.collection.collection
      }
    }
  }
}
</script>
