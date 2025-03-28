<template>
    <q-card flat bordered class="description">
      <q-card-section vertical>
        <q-icon :name="$route.params.uuid ? 'public' : 'public_off'" size = "md" class="q-pr-sm" />
        <span class="text-h6" v-text="media.title"></span>
        <q-btn-dropdown dropdown-icon="fas fa-share-nodes" class="q-pa-md float-right" flat>
          <q-list>
            <q-item v-if="$route.params.uuid" clickable v-close-popup @click="copyLink('public')">
              <q-item-section avatar>
                <q-avatar icon="public" color="accent" text-color="white" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Share within this channel</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="far fa-copy" color="accent" />
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
                <q-icon name="far fa-copy" color="accent" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <div class="text-subtitle2 q-pl-xl">Captured {{ daysSince(media.resource_date, false) }}</div>
        <div class="text-subtitle2 q-pl-xl">Published {{ daysSince(media.created) }}</div>
      </q-card-section>
      <q-separator inset v-if="description_safe" />
      <q-card-section vertical>
        <div class="text-body1" v-html="description_safe"></div>
      </q-card-section>
    </q-card>
</template>

<script>
import { Notify, copyToClipboard } from 'quasar'
import { daysSince, sanitizeHtml } from '@javascript/library.js'

export default {
  name: 'MediaDescription',

  props: {
    media: Object
  },

  computed: {
    description_safe: {
      get() {
        return sanitizeHtml(this.media.description_unsafe)
      }
    }
  },

  methods: {
    daysSince(date, withTime = true) {
      return daysSince(date, withTime)
    },
    copyLink(val) {
      if (val === 'public') {
        copyToClipboard(window.location.href)
          .then(() => {
            Notify.create({
              message: 'URL copied to clipboard',
              color: 'accent',
              icon: 'far fa-clipboard',
              timeout: 1000
            })
          })
      } else if (val === 'private') {
        copyToClipboard(window.location.origin + '/private/' + this.media.private_id)
          .then(() => {
            Notify.create({
              message: 'URL copied to clipboard',
              color: 'accent',
              icon: 'far fa-clipboard',
              timeout: 1000
            })
          })
      }
    }
  }
}
</script>

<style scoped>
.description {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}
</style>
