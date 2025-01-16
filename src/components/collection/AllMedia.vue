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
  name: 'AllMedia-Root',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    )
  },

  data() {
    return {
      selectedView: 'all'
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
