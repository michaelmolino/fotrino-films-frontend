<template>
  <div v-if="profile?.id">
    <div v-if="!$q.platform.is.mobile && !$q.platform.is.desktop">
      Unsupported platform.
    </div>
    <div v-if="$q.platform.is.mobile">
      Mobile upload is not supported. This is a longer term goal.
    </div>
    <div v-if="$q.platform.is.desktop">
      <q-item class="q-pa-md">
          <q-item-section side>
              <q-icon name="fas fa-cloud-arrow-up" size="xl" />
          </q-item-section>
          <q-item-section>
              <q-item-label class="text-h4">Upload Media</q-item-label>
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
            <div>
              A Collection represents the highest level of organization for your media. If you intend to upload all of your videos in one location then you will only ever need a single collection. If you create multiple collections, they will remain independent of one another; media from one collection (such as movies or chapters) will not be accessible or discoverable from another.
            </div>
            <div class="q-pt-md">
              For more help, see <q-btn flat icon="fas fa-circle-question" label="Terminology" to="/help?item=terminology"/>.
            </div>
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
          <div>
            Movies are the next organizational level for your chapters (media files). Each collection can include multiple Movies, with each Movie containing at least one chapter.
          </div>
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
              </span>
            </div>
          </div>
        </q-step>

        <q-step
          :name="3"
          title="Chapter"
          icon="fas fa-file-video"
          :done="step > 3"
        >
          <div>
            Chapters represent the actual media files and can be either video or audio. Completing this form will create a `pending` record of the chapter on our servers. Once you click `Finish` you will receive instructions on how to upload your media from your desktop computer.
          </div>
          <div class="q-pt-md">
            <strong>Note</strong>: This process is currently intended for advanced users but will be made more user-friendly in the future.
          </div>
          <div class="row">
            <div class="q-pa-md" style="width: 50%;">
              <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelChapterNew.title" label="Title"
              />
              <q-input outlined autogrow :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'" class="q-pb-md"
                v-model="modelChapterNew.description" label="Description - p, br, strong, and i tags allowed"
              />
              <q-checkbox outlined v-model="modelChapterNew.main" label="Featured" />
            </div>
          </div>
        </q-step>

        <q-step
          :name="4"
          title="Upload"
          caption="via Terminal"
          icon="fas fa-terminal"
          active-icon="fas fa-terminal"
        >
          <div class="row q-py-sm">
            <div class="q-pa-sm">Install dependencies; These instructions are for Mac; Windows and Linux users will need to adapt them.</div>
            <QCodeBlock
                :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
                :code="code1"
                language="bash"
                numbered
                showHeader
                file-name="Install Dependencies"
                style="width: 100%;"
            />
          </div>
          <div class="q-pa-sm">Create a folder for your media such as <span class="inline-code">mkdir -p ~/fotrino/Media</span>.</div>
          <div class="q-pa-sm">
            Add the following media files to your new folder.
            <q-list style="width: 100%; max-width: 720px;" dense bordered class="q-my-md">
              <q-item>
                <q-item-section class="text-weight-bold text-center">Description</q-item-section>
                <q-item-section class="text-weight-bold text-center">Aspect Ratio</q-item-section>
                <q-item-section class="text-weight-bold text-center">Filename</q-item-section>
              </q-item>
              <q-item v-if="modelCollection.value === 0">
                <q-item-section>Collection Cover</q-item-section>
                <q-item-section>Square</q-item-section>
                <q-item-section><span class="inline-code">Collection.jpg</span></q-item-section>
              </q-item>
              <q-item v-if="modelMovie.value === 0">
                <q-item-section>Movie Poster</q-item-section>
                <q-item-section>2:3 (portrait)</q-item-section>
                <q-item-section><span class="inline-code">Movie.jpg</span></q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Media File</q-item-section>
                <q-item-section>16:9 (landscape)</q-item-section>
                <q-item-section><span class="inline-code">Media.(mp4|mov|mp3)</span></q-item-section>
              </q-item>
              <q-item>
                <q-item-section>Media Preview</q-item-section>
                <q-item-section>16:9 (landscape)</q-item-section>
                <q-item-section><span class="inline-code">Preview.(jpg|png)</span></q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="q-pa-sm">Run the upload script.</div>
          <QCodeBlock
              :theme="$q.dark.isActive ? 'nightOwl' : 'github'"
              code="~/Workspace/fotrino-films-uploader/fotrino-upload.sh ~/fotrino/Media"
              language="bash"
              numbered
              showHeader
              file-name="Media Prepare / Upload"
              style="width: 100%;"
          />
          <div class="q-pa-sm">When prompted, copy/past the below JSON - it should never be shared with anyone.</div>
        <QCodeBlock :showHeader="true" :theme="$q.dark.isActive ? 'nightOwl' : 'github'" language="json" :code="secret" />
      </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <!-- <q-btn flat @click="$refs.stepper.previous()" label="Back" :disabled="step==1 ? true : false" /> -->
            <q-btn v-if="step < 4" flat @click="$refs.stepper.next()" :label="step <3 ? 'Next' : 'Finish'" :disabled="(step==4 ? true : false) || !next" />
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
      modelCollectionNew: ref({ title: null }),
      modelMovie: ref(null),
      modelMovieNew: ref({ title: null, subtitle: null }),
      movies: [],
      modelChapterNew: ref({ title: null, description: null, main: true }),
      secret: '',
      code1: `xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" # Requires sudo
brew install coreutils gnu-tar git python ffmpeg graphicsmagick exiftool mediainfo jq curl
git clone https://github.com/vincentbernat/video2hls.git ~/Workspace/video2hls # Credit to Vincent Bernat
git clone https://github.com/michaelmolino/fotrino-films-uploader.git ~/Workspace/fotrino-films-uploader # This is still under development`
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
    },
    step(s) {
      if (s === 4) {
        this.$store.dispatch('collection/postUpload', this.payload).then(_response => {
          this.secret = JSON.stringify(_response, null, 4)
        })
          .catch(err => {
            console.log(err)
          })
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
        }
        obj.movie = {}
        if (this.modelMovie.value !== 0) {
          obj.movie.id = this.modelMovie.value
        } else {
          obj.movie.title = this.modelMovieNew.title
          obj.movie.subtitle = this.modelMovieNew.subtitle
        }
        obj.movie.chapter = {}
        obj.movie.chapter.title = this.modelChapterNew.title
        obj.movie.chapter.description = this.modelChapterNew.description
        obj.movie.chapter.main = this.modelChapterNew.main
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
