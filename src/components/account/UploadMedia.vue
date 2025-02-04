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
                v-model="collectionModel" :options="collections.map(({ uuid, title }) => ({ value: uuid, label: title })).concat({ value: 0, label: 'New...' })"
              />
            </div>
            <div class="q-pa-md" style="width: 50%;">
              <span v-if="collectionModel?.value === 0">
                <q-input outlined :color="$q.dark.isActive ? 'blue-grey-11' : 'blue-grey-10'"
                  v-model="collectionModelNew" label="Collection"
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
          TODO
        </q-step>

        <q-step
          :name="3"
          title="Media"
          icon="fas fa-file-video"
        >
          TODO
        </q-step>

        <q-step
          :name="4"
          title="Upload"
          caption="via Terminal"
          icon="fas fa-terminal"
        >
          <QCodeBlock :theme="$q.dark.isActive ? 'nightOwl' : 'github'" language="text" code="Hello World" />
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <q-btn flat @click="$refs.stepper.previous()" label="Back" :disabled="step==1 ? true : false" />
            <q-btn flat @click="$refs.stepper.next()" label="Next" :disabled="(step==4 ? true : false) || !next" />
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
      collectionModel: ref(null),
      collectionModelNew: ref(null),
      movieModel: ref(null),
      movieModelNew: ref(null)
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
    movies: {
      get() {
        return null
      }
    },
    next: {
      get() {
        return (this.step === 1 && (this.collectionModel?.value || this.collectionModelNew)) || false
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
