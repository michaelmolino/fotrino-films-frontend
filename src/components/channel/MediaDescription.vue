<template>
  <q-card flat bordered class="description">
    <q-card-section vertical>
      <q-icon :name="isPublic ? 'public' : 'public_off'" size="md" class="q-pr-sm" />
      <span class="text-h6">{{ media?.title || '' }}</span>
      <q-btn-dropdown dropdown-icon="fas fa-share-nodes" class="q-pa-md float-right" flat>
        <q-list>
          <q-item v-if="isPublic" clickable v-close-popup @click="copyLink('public')">
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
              <q-item-label v-if="isPublic">Share only this video</q-item-label>
              <q-item-label v-else>Share this video</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="far fa-copy" color="accent" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <div class="text-subtitle2 q-pl-xl">Captured {{ sinceCaptured }}</div>
      <div class="text-subtitle2 q-pl-xl">Published {{ sincePublished }}</div>
    </q-card-section>
    <q-separator inset v-if="descriptionSafe" />
    <q-card-section vertical>
      <div class="text-body1" v-html="descriptionSafe"></div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Notify, copyToClipboard } from 'quasar'
import { sanitizeHtml } from '@utils/text.js'
import { daysSince } from '@utils/date.js'

const props = defineProps({
  media: Object
})

const route = useRoute()
const isPublic = computed(() => !!route.params.uuid)
const sinceCaptured = computed(() => props.media?.resource_date ? daysSince(props.media.resource_date, false) : '')
const sincePublished = computed(() => props.media?.created ? daysSince(props.media.created) : '')
const descriptionSafe = computed(() => sanitizeHtml(props.media?.description_unsafe || ''))

function copyLink(val) {
  if (val === 'public') {
    copyToClipboard(window.location.href).then(() => {
      Notify.create({ message: 'URL copied to clipboard', color: 'accent', icon: 'far fa-clipboard', timeout: 1000 })
    })
  } else if (val === 'private') {
    const id = props.media?.private_id
    if (!id) return
    copyToClipboard(`${window.location.origin}/private/${id}`).then(() => {
      Notify.create({ message: 'URL copied to clipboard', color: 'accent', icon: 'far fa-clipboard', timeout: 1000 })
    })
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
