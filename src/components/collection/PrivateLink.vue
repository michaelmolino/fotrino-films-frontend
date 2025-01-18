<template>
    <div v-if="privateChapter?.chapter?.privateId">

    <q-item dense class="q-pb-md">
        <q-item-section side v-if="$q.screen.gt.xs">
            <q-avatar>
                <img :src=privateChapter.collection.cover>
            </q-avatar>
        </q-item-section>
        <q-item-section>
            <q-breadcrumbs>
            <template v-slot:separator>
                <q-icon size="1.5em" name="chevron_right" color="primary" />
            </template>
            <q-breadcrumbs-el
                :class="$q.screen.gt.xs ? 'text-h5' : 'text-h6'"
                :label="privateChapter.collection.title"
            />
            <q-breadcrumbs-el
                :class="$q.screen.gt.xs ? 'text-h5' : 'text-h6'"
                :label="privateChapter.movie.title"
            />
            </q-breadcrumbs>
            <q-item-label caption>By {{ privateChapter.ownername }}</q-item-label>
        </q-item-section>
    </q-item>

      <PlyrPlayer v-if="!(this.$route.query?.fallback ?? false)" :chapter="privateChapter.chapter" style="width: 100%; max-width: 720px; min-width: 240px;" class="q-pb-md" />
      <VidstackPlayer v-else :chapter="privateChapter.chapter" style="width: 100%; max-width: 720px; min-width: 240px;" />

      <div style="width: 100%; max-width: 720px; min-width: 240px;">
        <q-icon name="public_off" size = "md" class="q-pr-sm" /><span class="text-h6" v-text="privateChapter.chapter.title"></span>
         <span class="text-h6">&nbsp;</span>
        <q-btn-dropdown dropdown-icon="share" class="q-pa-md float-right" flat color="accent">
          <q-list>
            <q-item clickable v-close-popup @click="copyLink('private')">
              <q-item-section avatar>
                <q-avatar icon="public_off" color="accent" text-color="white" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Share this video</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="content_copy" color="accent" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <div class="text-subtitle2 q-pl-xl" v-html="privateChapter.chapter.description_sanitised"></div>
      </div>

    </div>
  </template>

<script>
import { defineAsyncComponent } from 'vue'
import { Notify, copyToClipboard } from 'quasar'

export default {
  name: 'PrivateLink',

  components: {
    // Breadcrumbs: defineAsyncComponent(() =>
    //   import('@components/collection/Breadcrumbs.vue')
    // ),
    VidstackPlayer: defineAsyncComponent(() =>
      import('@components/collection/VidstackPlayer.vue')
    ),
    PlyrPlayer: defineAsyncComponent(() =>
      import('@components/collection/PlyrPlayer.vue')
    )
  },

  created() {
    this.$store.dispatch('collection/getPrivateChapter', this.$router.currentRoute.value.params.privateId)
    //   .then(ch => {
    //     console.log('DEBUG: ' + ch)
    //     this.chapter = ch
    //   })
      .catch(error => {
        console.log(error)
      })
  },

  computed: {
    privateChapter: {
      get() {
        return this.$store.state.collection.privateChapter
      },
      set(_privateChapter) {
        console.log('I AM SET', _privateChapter)
        this.$store.commit('collection/SET_PRIVATE_CHAPTER', _privateChapter)
      }
    }
  },

  methods: {
    copyLink(val) {
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
  }
}
</script>
