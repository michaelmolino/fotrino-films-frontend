<template>
  <div class="q-pa-md">
    <template v-if="loading">
      <div class="row items-start q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" v-for="n in 6" :key="n">
          <q-skeleton type="rect" class="q-mb-sm skeleton-medium" />
          <q-skeleton type="text" width="80%" />
          <q-skeleton type="text" width="60%" />
        </div>
      </div>
    </template>

    <template v-else-if="channel?.uuid === route.params.uuid">
      <div :key="channel?.uuid || route.fullPath">
        <div class="row items-center q-mb-sm">
          <BreadCrumbs :channel="channel" :project="null" :media="null" />
          <q-space />
          <ViewToggle
            v-model="selectedView"
            :projectCount="projectCount"
            :mainCount="mainCount"
            :allCount="allCount" />
        </div>

        <q-separator spaced />

        <template v-if="selectedView === 'projects'">
          <div class="row q-mt-sm">
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
        </template>

        <template v-else>
          <div class="row q-pt-md">
            <div
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm text-center"
              v-for="item in sortedMedia"
              :key="item.media.id">
              <MediaPreview
                :channel="channel"
                :project="item.project"
                :media="item.media"
                :to="`/${channel.uuid}/${channel.slug}/${item.project.slug}/${item.media.slug}`"
                :detail="true"
                :showMainAccent="selectedView !== 'main'" />
            </div>
            <NothingText v-if="sortedMedia.length === 0" text="No content available." />
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <NothingText text="Channel not found or unavailable." />
    </template>
  </div>
</template>

<script setup>
import { ref, toRef, computed, defineAsyncComponent, watch } from 'vue'
import { getViewPreference, setViewPreference } from '@utils/viewPreference.js'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { sortBy } from '@utils/sort.js'

import BreadCrumbs from '@components/shared/BreadCrumbs.vue'
import ProjectPoster from '@components/channel/ProjectPoster.vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
import ViewToggle from './ChannelRoot/ViewToggle.vue'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const store = useStore()
const route = useRoute()
const selectedView = ref(getViewPreference('all'))
const loading = ref(true)
const channel = toRef(store.state.channel, 'channel')

watch(
  [channel, () => route.params.uuid],
  ([newChannel, newUuid]) => {
    // If we have a route UUID but no matching channel, we're still loading
    if (newUuid && (!newChannel || newChannel.uuid !== newUuid)) {
      loading.value = true
    } else if (newChannel?.uuid === newUuid) {
      // Channel matches route, we're done loading
      loading.value = false
    } else if (!newUuid) {
      loading.value = false
    }
  },
  { immediate: true }
)

watch(selectedView, val => {
  setViewPreference(val)
})

const projects = computed(() => {
  if (loading.value || !channel.value) return []
  return channel.value.projects || []
})

const allMedia = computed(() => {
  if (loading.value || !channel.value) return []
  return (channel.value.projects || []).flatMap(project =>
    (project.media || []).map(media => ({ media, project }))
  )
})

const mainMedia = computed(() => {
  if (loading.value) return []
  return allMedia.value.filter(f => f.media?.main)
})

const sortedMedia = computed(() => {
  if (loading.value) return []
  const arr = selectedView.value === 'main' ? mainMedia.value : allMedia.value
  return sortBy(arr, 'media.resource_date', 'desc')
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
