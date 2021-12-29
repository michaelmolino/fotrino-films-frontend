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
import Breadcrumbs from '../components/Breadcrumbs.vue'
import ChapterPreview from '../components/ChapterPreview.vue'

export default {
  name: 'ChapterIndex',
  components: {
    Breadcrumbs,
    ChapterPreview
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
        movieId: this.$route.params.movieId,
        chapterId: null
      })
      .then(() => {
        this.breadcrumbs = [
          {
            id: 0,
            label: this.collection.title,
            to: '/' + this.$route.params.userUuid
          },
          { id: 1, label: this.movie.title, to: null }
        ]

        this.metaData = {
          title: this.movie.title + ' | fotrino-films',
          meta: {
            ogTitle: {
              property: 'og:title',
              content: this.movie.title + ' | fotrino-films'
            },
            ogImage: { name: 'og:image', content: this.movie.coverUrl }
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
    },
    movie: {
      get () {
        return this.$store.state.collection.movie
      }
    }
  },
  meta () {
    return this.metaData
  }
}
</script>
