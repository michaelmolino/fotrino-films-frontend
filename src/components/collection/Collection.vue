<template>
  <div v-if="collection.uuid">

    <div class="row">
      <Breadcrumbs
        :collection="collection"
        :movie="this.$nullMovie"
        :chapter="this.$nullChapter"
      />

      <q-space />

      <q-btn-toggle
          class="q-py-md"
          v-model="selectedView"
          no-caps
          rounded
          unelevated
          toggle-color="primary"
          color="white"
          text-color="primary"
          :options="[
            {label: 'Movies', value: 'movies'},
            {value: 'all', slot: 'all'}
          ]"
        >
          <template v-slot:all>
            <div class="row items-center no-wrap">
              <div class="text-center">
                All Media &nbsp;
              </div>
              <q-avatar color="accent" text-color="white" size="sm" square>{{ collection.movies.flatMap(movie => movie.chapters).length }}</q-avatar>
            </div>
          </template>
        </q-btn-toggle>
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

      <div v-if="collection.movies.length === 0">
        This collection is empty!
      </div>
    </div>
    <div class="row q-pt-md" v-if="selectedView=='all'">
        <div
          class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm"
          v-for="item in collection.movies.flatMap(movie => movie.chapters.map(chapter => ({ chapter: chapter, movie: movie }))).sort((b, a) => a.chapter.created.localeCompare(b.chapter.created))"
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
      selectedView: 'movies'
    }
  },

  computed: {
    collection: {
      get() {
        return this.$store.state.collection.collection
      }
    }
  }

  // methods: {
  //   changeViewMode() {
  //     if (this.selectedView === 'collections') {
  //       this.$router.push({ path: '/' + this.collection.uuid + '/' + this.collection.slug })
  //     }
  //     if (this.selectedView === 'all') {
  //       this.$router.push({ path: '/' + this.collection.uuid + '/' + this.collection.slug + '/all' })
  //     }
  //   }
  // }
}
</script>
