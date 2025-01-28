<template>
  <div v-if="collection.uuid">

    <div class="row">
      <BreadCrumbs
        :collection="collection"
        :movie="this.$nullMovie"
        :chapter="this.$nullChapter"
      />
      <q-space />
      <ViewToggle v-model="selectedView"
        :movieCount="collection.movies.length"
        :mainCount="collection.movies.flatMap(movie => movie.chapters).filter(ch => ch.main).length"
        :allCount="collection.movies.flatMap(movie => movie.chapters).length"
      />
    </div>

    <div class="row" v-if="selectedView=='movies'">
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
      <NothingText v-if="collection.movies.length === 0" />
    </div>

    <div class="row q-pt-md" v-else>
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm"
        v-for="item in collection.movies.flatMap(movie => movie.chapters.map(chapter => ({ chapter: chapter, movie: movie }))).filter((f) => selectedView == 'main' ? f.chapter.main : true).sort((b, a) => a.chapter.created.localeCompare(b.chapter.created))"
        :key="item.chapter.id"
        style="text-align:center;"
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
      <NothingText v-if="collection.movies.flatMap(movie => movie.chapters.map(chapter => ({ chapter: chapter, movie: movie }))).filter((f) => selectedView == 'main' ? f.chapter.main : true).length === 0" />
    </div>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { LocalStorage } from 'quasar'

export default {
  name: 'CollectionRoot',

  components: {
    BreadCrumbs: defineAsyncComponent(() =>
      import('@components/collection/BreadCrumbs.vue')
    ),
    MoviePoster: defineAsyncComponent(() =>
      import('@components/collection/MoviePoster.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    ),
    ViewToggle: defineAsyncComponent(() =>
      import('@components/collection/ViewToggle.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  data() {
    return {
      view: null
    }
  },

  computed: {
    selectedView: {
      get() {
        return this.view || LocalStorage.getItem('last-selected-view') || 'all'
      },
      set(val) {
        LocalStorage.set('last-selected-view', val)
        this.view = val
      }
    },
    collection: {
      get() {
        return this.$store.state.collection.collection
      }
    }
  }

}
</script>
