<template>
  <span v-if="collection">
    <Breadcrumbs
      :userUuid="$route.params.userUuid"
      :collection="collection"
      :movie="null"
      :chapter="null"
    />
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="movie in collection.movies"
        :key="movie.id"
      >
        <MovieCover
          :badge="true"
          :movie="movie"
          :userUuid="$route.params.userUuid"
        />
      </div>
    </div>
  </span>
</template>

<script>
import { useMeta } from 'quasar'
import { defineAsyncComponent, ref } from 'vue'

import { setMetaData } from '../javascript/library.js'

export default {
  name: 'MovieIndex',
  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('../components/Breadcrumbs.vue')
    ),
    MovieCover: defineAsyncComponent(() =>
      import('../components/MovieCover.vue')
    )
  },
  created: function () {
    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: null,
        chapterId: null
      })
      .then(() => {
        this.metaData = setMetaData(
          this.collection.title,
          this.collection.coverUrl
        )
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
