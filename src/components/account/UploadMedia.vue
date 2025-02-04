<template>
  <div v-if="profile?.id">
    <div v-if="!$q.platform.is.mobile && !$q.platform.is.desktop">
      Unsupported platform.
    </div>
    <div v-if="$q.platform.is.mobile">
      Mobile upload is not supported.
    </div>
    <div v-if="$q.platform.is.desktop">
      <q-item class="q-pa-md">
          <q-item-section side>
              <q-icon name="fab fa-apple" size="xl" />
          </q-item-section>
          <q-item-section>
              <q-item-label class="text-h4">Upload for Apple Mac</q-item-label>
              <q-item-label>Uploading media is an advanced operation; you should be comfortable using the terminal.</q-item-label>
          </q-item-section>
      </q-item>
      <q-stepper
        v-model="step"
        ref="stepper"
        flat
        bordered
        active-color="info"
        :inactive-color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
        done-color="positive"
      >
        <q-step
          :name="1"
          title="Collection"
          icon="fas fa-video"
          :done="step > 1"
        >
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Collection"
                v-model="modelCollection" :options="collections.map(({ uuid, title }) => ({ value: uuid, label: title })).concat({ value: 0, label: 'New...' })"
              />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="modelCollection?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelCollectionNew.title" label="Collection Title"
                />
                <q-input v-model="modelCollectionNew.date" outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" type="date" />
              </span>
            </div>
          </div>
        </q-step>

        <q-step
          :name="2"
          title="Movie"
          icon="fas fa-film"
          :done="step > 2"
        >
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-select outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" label="Movie"
                v-model="modelMovie" :options="movies.map(({ id, title }) => ({ value: id, label: title })).concat({ value: 0, label: 'New...' })"
              />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="modelMovie?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelMovieNew.title" label="Movie Title"
                />
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                  v-model="modelMovieNew.subtitle" label="Movie SubTitle"
                />
                <q-input v-model="modelMovieNew.date" outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" type="date" />
              </span>
            </div>
          </div>
        </q-step>

        <q-step
          :name="3"
          title="Media"
          icon="fas fa-file-video"
        >
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelChapterNew.title" label="Title"
              />
              <q-input outlined autogrow :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelChapterNew.description" label="Description - p, br, strong, and i tags allowed"
              />
              <q-input v-model="modelChapterNew.date" outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" type="date" />
            </div>
          </div>
        </q-step>

        <q-step
          :name="4"
          title="Upload"
          caption="via Terminal"
          icon="fas fa-terminal"
        >
          Upload not yet implemented.
          <QCodeBlock :theme="$q.dark.isActive ? 'nightOwl' : 'github'" language="json" :code="payload" />
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <!-- <q-btn flat @click="$refs.stepper.previous()" label="Back" :disabled="step==1 ? true : false" /> -->
            <q-btn v-if="step < 4" flat @click="$refs.stepper.next()" label="Next" :disabled="(step==4 ? true : false) || !next" />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </div>
  </div>
  <div v-else>
    <NothingText />
  </div>
</template>

<script>
import { defineAsyncComponent, ref } from 'vue'
import { Notify, copyToClipboard } from 'quasar'
import { CodeBlock } from 'vuejs-code-block'

export default {
  name: 'UploadMedia',

  components: {
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    ),
    QCodeBlock: CodeBlock
  },

  created: function() {
    this.$store.cache.dispatch('collection/getCollections').catch(error => { console.log(error) })
  },

  data() {
    return {
      step: ref(1),
      modelCollection: ref(null),
      modelCollectionNew: ref({ title: null, date: new Date().toISOString().split('T')[0] }),
      modelMovie: ref(null),
      modelMovieNew: ref({ title: null, subtitle: null, date: new Date().toISOString().split('T')[0] }),
      movies: [],
      modelChapterNew: ref({ title: null, description: null, main: true, date: new Date().toISOString().split('T')[0] })
    }
  },

  watch: {
    modelCollection(c) {
      if (c && c.value !== 0) {
        this.$store.cache
          .dispatch('collection/getCollection', c.value)
          .then(_collection => {
            this.movies = _collection.movies
          })
          .catch(() => {
            this.modelCollection = null
          })
      } else {
        this.movies = []
      }
    }
  },

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    },
    collections: {
      get() {
        return this.$store.state.collection.collections
      }
    },
    payload: {
      get() {
        const obj = {}
        if (this.modelCollection.value !== 0) {
          obj.uuid = this.modelCollection.value
        } else {
          obj.title = this.modelCollectionNew.title
          obj.created = this.modelCollectionNew.date
        }
        obj.movie = {}
        if (this.modelMovie.value !== 0) {
          obj.movie.id = this.modelMovie.value
        } else {
          obj.movie.title = this.modelMovieNew.title
          obj.movie.subtitle = this.modelMovieNew.subtitle
          obj.movie.created = this.modelMovieNew.date
        }
        obj.movie.chapter = {}
        obj.movie.chapter.title = this.modelChapterNew.title
        obj.movie.chapter.description = this.modelChapterNew.description
        obj.movie.chapter.created = this.modelChapterNew.date
        return JSON.stringify(obj, null, 4)
      }
    },
    next: {
      get() {
        switch (this.step) {
          case 1:
            return this.modelCollection?.value || this.modelCollectionNew.title
          case 2:
            return this.modelMovie?.value || this.modelMovieNew.title
          case 3:
            return this.modelChapterNew.title
          case 4:
            return false
          default:
            return false
        }
      }
    }
  },

  methods: {
    getToken() {
      this.$store.cache.dispatch('account/getToken').then(_token => {
        copyToClipboard(_token)
          .then(() => {
            Notify.create({
              message: 'Secret token copied to clipboard!',
              color: 'accent',
              icon: 'far fa-clipboard',
              timeout: 0,
              actions: [{ label: 'Clear Clipboard', color: 'white', handler: () => { copyToClipboard('Secret token cleared from clipboard!') } }]
            })
          })
      })
    }
  }
}
</script>

<style>
.inline-code {
    display: inline-block;
    padding: 4px 6px;
    font-size: 16px;
    line-height: 16px;
    border-radius: 4px;
    font-family: inherit;
    color: #E01E5A;
    vertical-align: baseline;
    border: 1px solid currentColor;
}
</style>
