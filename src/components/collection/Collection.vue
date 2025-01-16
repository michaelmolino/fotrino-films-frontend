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
        @update:model-value="changeViewMode"
      />
  </div>

    <div class="row q-pt-md" v-if="selectedView=='collections'">
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
  },

  methods: {
    changeViewMode() {
      if (this.selectedView === 'collections') {
        this.$router.push({ path: '/' + this.collection.uuid + '/' + this.collection.slug })
      }
      if (this.selectedView === 'all') {
        this.$router.push({ path: '/' + this.collection.uuid + '/' + this.collection.slug + '/all' })
      }
    }
  }
}
</script>
