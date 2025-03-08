<template>
<div style="max-width: 480px;">
  <q-list bordered class="rounded-borders">
    <q-expansion-item
      v-for="channel in channels" :key="channel.uuid"
      expand-icon-toggle
      expand-separator
      switch-toggle-side
      group="channels"
      :disable="channel.pending"
    >
      <template v-slot:header>
        <div class="header-content">
          <q-item-section avatar>
            <q-avatar>
              <q-img :src="channel.cover" class="cover" />
            </q-avatar>
          </q-item-section>
          <q-item-section class="text-no-wrap ellipsis fit-to-width">
            {{ channel.title }}
          </q-item-section>
          <q-item-section class="header-buttons">
            <div class="row no-wrap">
              <q-btn v-if="channel.pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
                <q-tooltip>Pending</q-tooltip>
              </q-btn>
              <q-btn :disable="channel.pending" dense unelevated icon="delete" color="negative" class="q-ml-xs" @click="deleteResource('channel', channel.id)">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </div>
      </template>
      <q-expansion-item
        v-for="project in channel.projects" :key="project.id"
        :header-inset-level="0.5"
        :content-inset-level="1"
        expand-icon-toggle
        expand-separator
        switch-toggle-side
        group="projects"
        :disable="project.pending"
      >
      <template v-slot:header>
        <div class="header-content">
          <q-item-section avatar>
            <q-avatar>
              <q-img :src="project.poster" class="cover" />
            </q-avatar>
          </q-item-section>
          <q-item-section class="text-no-wrap ellipsis fit-to-width">
            {{ project.title }}
          </q-item-section>
          <q-item-section class="header-buttons">
            <div class="row no-wrap">
              <q-btn v-if="project.pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
                <q-tooltip>Pending</q-tooltip>
              </q-btn>
              <q-btn :disable="project.pending" dense unelevated icon="delete" color="negative" class="q-ml-xs" @click="deleteResource('project', project.id)">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </div>
      </template>
      <template v-slot:default>
        <div class="header-content"
          v-for="media in project.media" :key="media.id"
          expand-icon-toggle
          expand-separator
          switch-toggle-side
          group="media"
        >
          <q-item-section avatar>
            <q-avatar square>
              <q-img :src="media.preview" class="cover" />
            </q-avatar>
          </q-item-section>
          <q-item-section class="text-no-wrap ellipsis fit-to-width">
            {{ media.title }}
          </q-item-section>
          <q-item-section class="header-buttons">
            <div class="row no-wrap">
              <q-btn v-if="media.pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
                <q-tooltip>Pending</q-tooltip>
              </q-btn>
              <q-btn :disable="media.pending" :to="getMediaLink(media.id)" dense unelevated icon="link" color="info" class="q-mx-xs">
                <q-tooltip>Link</q-tooltip>
              </q-btn>
              <q-btn :disable="media.pending" dense unelevated icon="delete" color="negative" class="q-ml-xs" @click="deleteResource('media', media.id)">
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </div>
      </template>
      </q-expansion-item>
    </q-expansion-item>
  </q-list>
</div>
</template>

<script>
import { daysSince } from '@javascript/library.js'

export default {
  name: 'MediaBrowser',

  props: {
    channels: Object
  },

  methods: {
    daysSince(date) {
      return daysSince(date)
    },
    getMediaLink(mediaId) {
      for (const channel of this.channels) {
        for (const project of channel.projects) {
          const media = project.media.find((m) => m.id === mediaId)
          if (media) {
            if (!media.pending) {
              return '/' + [channel.uuid, channel.slug, project.slug, media.slug].join('/')
            } else {
              return ''
            }
          }
        }
      }
      return null
    },
    deleteResource(type, r) {
      this.$store.dispatch('channel/deleteResource', { type: type, id: r })
    }
  }
}
</script>

<style scoped>
.fit-to-width {
  display: inline-block;
  width: auto;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: 8px; /* Adjust the gap between buttons as needed */
}
</style>
