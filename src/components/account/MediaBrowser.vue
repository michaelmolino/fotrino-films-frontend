<template>
<div class="width480">
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
            <div class="text-no-wrap">
              <q-btn v-if="channel.pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
                <q-tooltip>Pending</q-tooltip>
              </q-btn>
              <q-btn v-if="!channel.pending" :to="getMediaLink('channel', channel.id)" target="_blank" dense unelevated icon="link" color="info" class="q-mx-xs">
                <q-tooltip>Link</q-tooltip>
              </q-btn>
              <q-btn v-if="!channel.pending" dense unelevated icon="delete" color="negative" class="q-ml-xs" @click="deleteResource('channel', channel.id)">
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
            <div class="text-no-wrap">
              <q-btn v-if="project.pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
                <q-tooltip>Pending</q-tooltip>
              </q-btn>
              <q-btn v-if="!project.pending" :to="getMediaLink('project', project.id)" target="_blank" dense unelevated icon="link" color="info" class="q-mx-xs">
                <q-tooltip>Link</q-tooltip>
              </q-btn>
              <q-btn v-if="!project.pending" dense unelevated icon="delete" color="negative" class="q-ml-xs" @click="deleteResource('project', project.id)">
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
            <div class="text-no-wrap">
              <q-btn v-if="media.pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
                <q-tooltip>Pending</q-tooltip>
              </q-btn>
              <q-btn v-if="!media.pending" :to="getMediaLink('media', media.id)" target="_blank" dense unelevated icon="link" color="info" class="q-mx-xs">
                <q-tooltip>Link</q-tooltip>
              </q-btn>
              <q-btn v-if="!media.pending" dense unelevated icon="delete" color="warning" class="q-ml-xs" @click="deleteResource('media', media.id)">
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
export default {
  name: 'MediaBrowser',

  props: {
    channels: Object
  },

  methods: {
    getMediaLink(type, id) {
      if (type === 'channel') {
        const channel = this.channels.find((ch) => ch.id === id)
        if (channel && !channel.pending) {
          return '/' + [channel.uuid, channel.slug].join('/')
        }
        return null
      }

      for (const channel of this.channels) {
        if (type === 'project') {
          const project = channel.projects.find((p) => p.id === id)
          if (project && !project.pending) {
            return '/' + [channel.uuid, channel.slug, project.slug].join('/')
          }
        } else if (type === 'media') {
          for (const project of channel.projects) {
            const media = project.media.find((m) => m.id === id)
            if (media && !media.pending) {
              return '/' + [channel.uuid, channel.slug, project.slug, media.slug].join('/')
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
  gap: 8px;
  max-width: 100px;
}
</style>
