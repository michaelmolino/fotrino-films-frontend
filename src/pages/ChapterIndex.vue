<template>
  <div v-if="movie">
    <Breadcrumbs :breadcrumbs="this.breadcrumbs" />
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="chapter in movie.chapters"
        :key="chapter.id"
      >
        <div :class="chapter.primary ? 'bg-accent' : ''">
          <q-btn
            flat
            dense
            no-caps
            :to="
              '/' +
                $route.params.userUuid +
                '/' +
                'movies' +
                '/' +
                movie.id +
                '/' +
                chapter.id
            "
            class="fit"
            padding="8px"
          >
            <ChapterPreview
              class="cursor-pointer"
              :id="chapter.id"
              :title="chapter.title"
              :previewUrl="chapter.previewUrl"
            />
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { ref } from 'vue'

import Breadcrumbs from '../components/Breadcrumbs.vue'
import ChapterPreview from '../components/ChapterPreview.vue'

import { setMetaData, setBreadcrumb } from '../javascript/library.js'

export default {
  name: 'ChapterIndex',
  components: {
    Breadcrumbs,
    ChapterPreview
  },
  data () {
    return {
      breadcrumbs: null
    }
  },
  created: function () {
    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: this.$route.params.movieId,
        chapterId: null
      })
      .then(() => {
        this.breadcrumbs = setBreadcrumb(
          this.$route.params.userUuid,
          this.collection,
          this.movie,
          null
        )

        this.metaData = setMetaData(this.movie.title, this.movie.coverUrl)
      })
  },
  computed: {
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    },
    movie: {
      get () {
        return this.$store.state.collection.movie
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
