<template>
  <div v-if="movie">

    <Breadcrumbs
      :collection="collection"
      :movie="movie"
      :chapter="chapter.main ? this.$nullChapter : chapter"
      :hideLinks="$route.params.privateId ? true : false"
    />

    <PlyrPlayer v-if="!(this.$route.query?.fallback ?? false)" :chapter="chapter" style="width: 100%; max-width: 720px; min-width: 240px;" class="q-py-md" />

    <q-card flat bordered style="width: 100%; max-width: 720px; min-width: 240px;">
      <q-card-section vertical>
        <q-icon :name="$route.params.uuid ? 'public' : 'public_off'" size = "md" class="q-pr-sm" />
        <span class="text-h6" v-text="chapter.title"></span>
        <q-btn-dropdown dropdown-icon="share" class="q-pa-md float-right" flat>
          <q-list>
            <q-item v-if="$route.params.uuid" clickable v-close-popup @click="copyLink('public')">
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

            <q-item clickable v-close-popup @click="copyLink('private')">
              <q-item-section avatar>
                <q-avatar icon="public_off" color="accent" text-color="white" />
              </q-item-section>
              <q-item-section>
                <q-item-label v-if="$route.params.uuid">Share only this video</q-item-label>
                <q-item-label v-if="$route.params.privateId">Share this video</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="content_copy" color="accent" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <div class="text-subtitle2">Published: {{ daysSince }}</div>
      </q-card-section>

      <q-separator inset v-if="chapter.description_sanitised" />

      <q-card-section vertical>
        <div class="text-body1" v-html="chapter.description_sanitised"></div>
      </q-card-section>
    </q-card>

    <span v-if="$route.params.uuid">
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
    </span>

    <div v-if="movie.chapters?.length === 0" class="q-pa-md">
      This movie is empty!
    </div>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { Notify, copyToClipboard } from 'quasar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default {
  name: 'ChapterIndex',

  components: {
    Breadcrumbs: defineAsyncComponent(() =>
      import('@components/collection/Breadcrumbs.vue')
    ),
    ChapterPreview: defineAsyncComponent(() =>
      import('@components/collection/ChapterPreview.vue')
    ),
    PlyrPlayer: defineAsyncComponent(() =>
      import('@components/collection/PlyrPlayer.vue')
    )
  },

  computed: {
    collection: {
      get() {
        let _collection = null
        if (this.$route.params.uuid) {
          _collection = this.$store.state.collection.collection
        } else if (this.$route.params.privateId) {
          _collection = this.$store.state.collection.privateChapter
        }
        return _collection
      }
    },
    movie: {
      get() {
        let _movie = null
        if (this.$route.params.uuid) {
          _movie = this.collection.movies.find(
            m => m.slug === this.$route.params.movieSlug
          )
          if (this.collection.uuid && !_movie) {
            this.$router.replace('/404')
          }
        } else if (this.$route.params.privateId) {
          _movie = this.collection.movie
        }
        return _movie
      }
    },
    chapter: {
      get() {
        let _chapter = null
        if (this.$route.params.uuid) {
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
        } else if (this.$route.params.privateId) {
          _chapter = this.collection.movie.chapter
        }
        return _chapter
      }
    },
    daysSince: {
      get() {
        return dayjs(this.chapter.created).fromNow()
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
      } else if (val === 'private') {
        copyToClipboard(window.location.origin + '/private/' + this.chapter.privateId)
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
    }
  }
}
</script>
