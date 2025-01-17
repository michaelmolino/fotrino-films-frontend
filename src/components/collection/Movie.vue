<template>
  <div v-if="movie">

    <Breadcrumbs
      class="q-pb-md"
      :collection="collection"
      :movie="movie"
      :chapter="chapter.main ? this.$nullChapter : chapter"
    />

    <PlyrPlayer v-if="!(this.$route.query?.fallback ?? false)" :chapter="chapter" style="width: 100%; max-width: 720px; min-width: 240px;" />
    <VidstackPlayer v-else :chapter="chapter" style="width: 100%; max-width: 720px; min-width: 240px;" />

    <div style="width: 100%; max-width: 720px; min-width: 240px;">
      <span class="text-h6" v-text="chapter.title"></span>
      <q-btn-dropdown dropdown-icon="share" class="q-pa-md float-right" flat color="accent">
        <q-list>
          <q-item clickable v-close-popup @click="copyLink('public')">
            <q-item-section avatar>
              <q-avatar icon="public" color="accent" text-color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Share within this collection</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="content_copy" color="accent" />
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="copyLink('private')" disabled>
            <q-item-section avatar>
              <q-avatar icon="public_off" color="accent" text-color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Share only this video</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="content_copy" color="accent" />
            </q-item-section>
            <q-tooltip>Not yet supported</q-tooltip>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <div class="text-subtitle2 q-pl-xl" v-html="chapter.description_sanitised"></div>
    </div>

    <div class="q-pt-md text-h6" v-if="movie.chapters?.filter(ch => ch.id !== chapter.id)?.length > 0">
      Related Content
    </div>

    <div class="row">
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="chapter in movie.chapters?.filter(ch => ch.id !== chapter.id)"
        :key="chapter.id"
      >
        <ChapterPreview
          :style="chapter.deleted ? 'filter: brightness(37.5%); max-width: 360px;' : 'max-width: 360px;'"
          :collection="collection"
          :movie="movie"
          :chapter="chapter"
          :to="'/' + collection.uuid + '/' + collection.slug + '/' + movie.slug + '/' + chapter.slug"
        />
      </div>
    </div>

    <div v-if="movie.chapters?.length === 0" class="q-pa-md">
      This movie is empty!
    </div>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { Notify, copyToClipboard } from 'quasar'

export default {
  name: 'ChapterIndex',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    ),
    VidstackPlayer: defineAsyncComponent(() =>
      import('@components/collection/VidstackPlayer.vue')
    ),
    PlyrPlayer: defineAsyncComponent(() =>
      import('@components/collection/PlyrPlayer.vue')
    )
  },
  computed: {
    collection: {
      get() {
        return this.$store.state.collection.collection
      }
    },
    movie: {
      get() {
        let _movie = null
        _movie = this.collection.movies.find(
          m => m.slug === this.$route.params.movieSlug
        )
        if (this.collection.uuid && !_movie) {
          this.$router.replace('/404')
        }
        return _movie
      }
    },
    chapter: {
      get() {
        let _chapter = null
        _chapter = this.movie?.chapters.find(
          ch => ch.slug === this.$route.params.chapterSlug
        )
        if (!_chapter) {
          _chapter = this.movie?.chapters.find(ch => ch.main)
        }
        if (this.collection.uuid && !_chapter) {
          this.$router.replace('/404')
        }
        if (_chapter.main) {
          this.$router.replace({
            params: { chapterSlug: null }
          })
        }
        return _chapter
      }
    }
  },

  methods: {
    copyLink(val) {
      if (val === 'public') {
        copyToClipboard(window.location.href)
          .then(() => {
            Notify.create({
              message: 'URL copied to clipboard',
              color: 'accent',
              icon: 'content_paste',
              timeout: 1000
            })
          })
          .catch(() => {
            // fail
          })
      }
      if (val === 'private') {
        console.log(window.location.origin)
        console.log(this.$route.path)
      }
    }
  }
}
</script>
