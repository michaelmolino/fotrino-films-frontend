<template>
  <div v-if="movie">
    <Breadcrumbs
      :userUuid="$route.params.userUuid"
      :collection="collection"
      :movie="movie"
      :chapter="null"
    />
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="chapter in movie.chapters"
        :key="chapter.id"
      >
        <ChapterPreview
          class="cursor-pointer"
          :chapterId="chapter.id"
          :movieId="movie.id"
          :title="chapter.title"
          :previewUrl="chapter.previewUrl"
          :primary="chapter.primary"
          :userUuid="$route.params.userUuid"
          :type="chapter.type"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { defineAsyncComponent, ref } from 'vue'

import { setMetaData } from '../../javascript/library.js'

export default {
  name: 'ChapterIndex',
  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('../../components/Breadcrumbs.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('../../components/ChapterPreview.vue')
    )
  },
  data () {
    return {
      movie: null
    }
  },
  created: function () {
    this.$store.cache
      .dispatch('collection/fetchCollection', this.$route.params.userUuid)
      .then(() => {
        this.movie = this.collection.movies.find(
          m => m.id === Number(this.$route.params.movieId)
        )
        this.metaData = setMetaData(this.movie.title, this.movie.coverUrl)
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
