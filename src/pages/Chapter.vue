<template>
  <div v-if="chapter">
    <Breadcrumbs :breadcrumbs="this.breadcrumbs" />
    <div class="row">
      <div class="q-pa-md col-xs-12">
        <video-player
          style="max-width: 720px"
          :options="{
            autoplay: !!$route.query.fbclid,
            controls: true,
            controlBar: {
              pictureInPictureToggle: false
            },
            fluid: true,
            responsive: true,
            poster: chapter.previewUrl,
            sources: [
              {
                src: chapter.src,
                type: chapter.type
              }
            ]
          }"
        />
        <div
          class="q-pt-md q-pl-md text-body"
          v-html="chapter.description"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import Breadcrumbs from '../components/Breadcrumbs.vue'
import VideoPlayer from '../components/VideoPlayer.vue'

export default {
  name: 'Chapter',
  components: {
    Breadcrumbs,
    VideoPlayer
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
        chapterId: this.$route.params.chapterId
      })
      .then(() => {
        this.breadcrumbs = [
          {
            id: 0,
            label: this.collection.title,
            to: '/' + this.$route.params.userUuid
          },
          {
            id: 1,
            label: this.movie.title,
            to:
              '/' +
              this.$route.params.userUuid +
              '/movies/' +
              this.$route.params.movieId
          },
          {
            id: 2,
            label: this.chapter.title,
            to: null
          }
        ]

        this.metaData = {
          title: this.chapter.title + ' | fotrino-films',
          meta: {
            ogTitle: {
              property: 'og:title',
              content: this.chapter.title + ' | fotrino-films'
            },
            ogImage: { name: 'og:image', content: this.chapter.previewUrl }
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
    },
    chapter: {
      get () {
        return this.$store.state.collection.chapter
      }
    }
  },
  meta () {
    return this.metaData
  }
}
</script>
