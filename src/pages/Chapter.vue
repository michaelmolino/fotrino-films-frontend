<template>
  <div v-if="chapter">
    <Breadcrumbs
      :userUuid="$route.params.userUuid"
      :collection="collection"
      :movie="movie"
      :chapter="chapter"
    />
    <div class="row">
      <div class="q-pa-md col-xs-12">
        <video-player style="max-width: 720px" :options="options" />
        <div
          class="q-pt-md q-pl-md text-body"
          v-html="chapter.description"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { useMeta } from 'quasar'
import { ref, defineAsyncComponent } from 'vue'

import { setMetaData } from '../javascript/library.js'

export default {
  name: 'Chapter',
  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('../components/Breadcrumbs.vue')
    ),
    VideoPlayer: defineAsyncComponent(() =>
      import('../components/VideoPlayer.vue')
    )
  },
  data () {
    return {
      options: null
    }
  },
  created: function () {
    this.$store
      .dispatch('collection/fetchCollection', {
        userUuid: this.$route.params.userUuid,
        movieId: this.$route.params.movieId,
        chapterId: this.$route.params.chapterId
      })
      .then(() => {
        this.options = {
          autoplay: !!this.$route.query.fbclid,
          controls: true,
          controlBar: {
            pictureInPictureToggle: false,
            captionsButton: false
          },
          fluid: true,
          responsive: true,
          poster: this.chapter.previewUrl,
          sources: [
            {
              src: this.chapter.src,
              type: this.chapter.type
            }
          ]
        }
        this.metaData = setMetaData(this.chapter.title, this.chapter.previewUrl)
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
