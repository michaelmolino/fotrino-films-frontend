<template>
  <div>
    <div v-if="profile.id && collection.id && movie.id">
      <div class="text-h6 text-center">
        <q-btn flat dense icon="arrow_upward" to="/dashboard" />
        <q-btn flat dense icon="arrow_back" :to="'/dashboard/' + collection.uuid + '/' + collection.slug" />
        Dashboard: {{ movie.title }}
        <ActionButtonOpenMovie :collection="collection" :movie="movie" />
      </div>
      <q-btn
        color="positive"
        icon="add"
        label="New Chapter"
        @click="newChapterDialog()"
      />
      <div class="row">
        <div
          v-for="chapter in movie.chapters"
          :key="chapter.id"
          class="q-pa-md col-xs-12 col-sm-4 col-md-3"
        >
          <div>
            <ChapterPreview :collection="collection" :movie="movie" :chapter="chapter" disable />
          </div>
          <ActionBarChapter :collection="collection" :movie="movie" :chapter="chapter" />
        </div>
      </div>
      <div v-if="movie.chapters.length === 0" class="q-py-md">
        No chapters yet.
      </div>
    </div>
    <div v-if="!profile.id" class="q-py-md">
      Not logged in!
    </div>
  </div>
</template>

<script>
import { useQuasar } from 'quasar'
import { defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'

import NewChapter from '@components/account/dialogs/NewChapter.vue'

export default {
  name: 'Chapter-Dashboard',

  components: {
    ActionButtonOpenMovie: defineAsyncComponent(() =>
      import('@components/account/ActionButtonOpen-Movie.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    ),
    ActionBarChapter: defineAsyncComponent(() =>
      import('@components/account/ActionBar-Chapter.vue')
    )
  },

  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    },
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    },
    movie: {
      get () {
        let _movie = null
        _movie = this.collection.movies.find(
          m => m.slug === this.$route.params.movieSlug
        )
        if (this.collection.uuid && !_movie) {
          this.$router.replace('/404')
        }
        return _movie
      }
    }
  },

  setup () {
    const $q = useQuasar()
    const store = useStore()
    const route = useRoute()

    function newChapterDialog () {
      $q.dialog({
        component: NewChapter
      })
        .onOk(data => {
          store
            .dispatch('collection/fetchCollection',
              route.params.uuid)
            .catch(error => {
              console.log(error)
            })
        })
        .onCancel(() => {
          // Do nothing.
        })
        .onDismiss(() => {
          // Do nothing.
        })
    }

    return { newChapterDialog }
  }
}
</script>
