<template>
  <div class="q-pa-md">
    <template v-if="channel?.uuid">
      <div :key="channel?.uuid || route.fullPath">
        <div class="row">
          <BreadCrumbs :channel="channel" :project="null" :media="null" />
          <q-space />
          <ViewToggle
            v-model="selectedView"
            :projectCount="projectCount"
            :mainCount="mainCount"
            :allCount="allCount" />
        </div>

        <div class="row" v-if="selectedView === 'projects'">
          <div
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
            v-for="project in projects"
            :key="project.id">
            <ProjectPoster
              :project="project"
              :to="`/${channel.uuid}/${channel.slug}/${project.slug}`" />
          </div>
          <NothingText v-if="projects.length === 0" text="No content available." />
        </div>

        <div class="row q-pt-md" v-else>
          <div
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm text-center"
            v-for="item in sortedMedia"
            :key="item.media.id">
            <MediaPreview
              :channel="channel"
              :project="item.project"
              :media="item.media"
              :to="`/${channel.uuid}/${channel.slug}/${item.project.slug}/${item.media.slug}`"
              :detail="true" />
          </div>
          <NothingText v-if="sortedMedia.length === 0" text="No content available." />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="row items-start q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" v-for="n in 6" :key="n">
          <q-skeleton type="rect" class="q-mb-sm skeleton-medium" />
          <q-skeleton type="text" width="80%" />
          <q-skeleton type="text" width="60%" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, toRef, computed, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'
import { LocalStorage } from 'quasar'
import { useRoute } from 'vue-router'

import BreadCrumbs from '@components/channel/BreadCrumbs.vue'
import ProjectPoster from '@components/channel/ProjectPoster.vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
import ViewToggle from '@components/channel/ViewToggle.vue'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const store = useStore()
const route = useRoute()
const view = ref(LocalStorage.getItem('last-selected-view') || 'all')
const selectedView = computed({
  get: () => view.value,
  set: val => {
    LocalStorage.set('last-selected-view', val)
    view.value = val
  }
})

const channel = toRef(store.state.channel, 'channel')

const projects = computed(() => {
  const list = channel.value?.projects || []
  return Array.isArray(list) ? list.slice() : []
})

const allMedia = computed(() => {
  if (!channel.value) return []
  return (channel.value.projects || []).flatMap(project =>
    (project.media || []).map(media => ({ media, project }))
  )
})
const mainMedia = computed(() => allMedia.value.filter(f => f.media?.main))
const sortedMedia = computed(() => {
  const arr = selectedView.value === 'main' ? mainMedia.value : allMedia.value
  return arr
    .slice()
    .sort((a, b) => (b.media?.resource_date || '').localeCompare(a.media?.resource_date || ''))
})

const projectCount = computed(() => projects.value.length)
const mainCount = computed(() => allMedia.value.filter(f => f.media?.main).length)
const allCount = computed(() => allMedia.value.length)
</script>

<style scoped>
.skeleton-medium {
  width: 100%;
  height: 200px;
}
</style>
