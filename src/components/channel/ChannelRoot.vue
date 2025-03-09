<template>
  <div v-if="channel?.uuid" class="q-pa-md">

    <div class="row">
      <BreadCrumbs
        :channel="channel"
        :project=null
        :media=null
      />
      <q-space />
      <ViewToggle v-model="selectedView"
        :projectCount="channel.projects.length"
        :mainCount="channel.projects.flatMap(project => project.media).filter(ch => ch.main).length"
        :allCount="channel.projects.flatMap(project => project.media).length"
      />
    </div>

    <div class="row" v-if="selectedView=='projects'">
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
        v-for="project in channel.projects"
        :key="project.id"
      >
        <ProjectPoster
          :project="project"
          :to="'/' + channel.uuid + '/' + channel.slug + '/' + project.slug"
        />
      </div>
      <NothingText v-if="channel.projects.length === 0" text="No content available." />
    </div>

    <div class="row q-pt-md" v-else>
      <div
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm text-center"
        v-for="item in channel.projects.flatMap(project => project.media.map(media => ({ media: media, project: project }))).filter((f) => selectedView == 'main' ? f.media.main : true).sort((b, a) => a.media.resource_date.localeCompare(b.media.resource_date))"
        :key="item.media.id"
      >
        <MediaPreview
          :channel="channel"
          :project="item.project"
          :media="item.media"
          :to="'/' + channel.uuid + '/' + channel.slug + '/' + item.project.slug + '/' + item.media.slug"
          :detail=true
        />
      </div>
      <NothingText v-if="channel.projects.flatMap(project => project.media.map(media => ({ media: media, project: project }))).filter((f) => selectedView == 'main' ? f.media.main : true).length === 0" text="No content available." />
    </div>

  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { LocalStorage } from 'quasar'

export default {
  name: 'ChannelRoot',

  components: {
    BreadCrumbs: defineAsyncComponent(() =>
      import('@components/channel/BreadCrumbs.vue')
    ),
    ProjectPoster: defineAsyncComponent(() =>
      import('@components/channel/ProjectPoster.vue')
    ),
    MediaPreview: defineAsyncComponent(() =>
      import('@components/channel/MediaPreview.vue')
    ),
    ViewToggle: defineAsyncComponent(() =>
      import('@components/channel/ViewToggle.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  data() {
    return {
      view: LocalStorage.getItem('last-selected-view') || 'all'
    }
  },

  computed: {
    selectedView: {
      get() {
        return this.view
      },
      set(val) {
        LocalStorage.set('last-selected-view', val)
        this.view = val
      }
    },
    channel: {
      get() {
        return this.$store.state.channel.channel
      }
    }
  }

}
</script>
