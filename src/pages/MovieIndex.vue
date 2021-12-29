<template>
  <span v-if="collection">
    <Breadcrumbs :breadcrumbs="this.breadcrumbs" />
    <div class="row">
      <div
        class="q-pa-md col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="movie in collection.movies"
        :key="movie.id"
      >
        <q-btn
          flat
          dense
          no-caps
          :to="
            '/' +
            $route.params.userUuid +
            '/' +
            movie.mediaType +
            '/' +
            movie.id
          "
          class="fit"
          padding="16px"
        >
          <q-badge
            style="z-index: 999 !important"
            class="bg-accent q-pa-md"
            align="middle"
            floating
            transparent
          >
            <span class="text-bold">{{ movie.chapters.length }}</span>
          </q-badge>
          <MovieCover
            :id="movie.id"
            :title="movie.title"
            :subTitle="movie.subTitle"
            :coverUrl="movie.coverUrl"
          />
        </q-btn>
      </div>
    </div>
  </span>
</template>

<script>
import Breadcrumbs from '../components/Breadcrumbs.vue'
import MovieCover from '../components/MovieCover.vue'

export default {
  name: 'MovieIndex',
  components: {
    Breadcrumbs,
    MovieCover
  },
  data () {
    return {
      metaData: null,
      breadcrumbs: null
    }
  },
  created: function () {
    this.$q.loading.show()

    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: null,
        chapterId: null
      })
      .then(() => {
        this.breadcrumbs = [{ id: 0, label: this.collection.title, to: null }]

        this.metaData = {
          title: this.collection.title + ' | fotrino-films',
          meta: {
            ogTitle: {
              property: 'og:title',
              content: this.collection.title + ' | fotrino-films'
            },
            ogImage: { name: 'og:image', content: this.collection.coverUrl }
          }
        }

        this.$q.loading.hide()
      })
  },
  computed: {
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    }
  },
  meta () {
    return this.metaData
  }
}
</script>
