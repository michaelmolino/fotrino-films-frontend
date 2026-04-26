<template>
  <div class="q-pa-md">
    <template v-if="loading || !channel || !project">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </template>

    <template v-else-if="channel.uuid === route.params.uuid">
      <BreadCrumbs
        :channel="channel"
        :project="project"
        :media="media?.main ? null : media"
        :private="!!route.params.privateId" />

      <NothingText
        v-if="!route.params.privateId && (project.media?.length || 0) === 0"></NothingText>
      <template v-else>
        <PlyrPlayer
          v-if="media"
          :media="media"
          :artist="channel?.ownername"
          class="q-py-md plyrplayer" />
        <div v-if="media" class="plyrplayer">
          <MediaDescription :media="media" />
        </div>

        <template v-if="hasRelatedContent">
          <div class="q-pt-md text-h6">More from {{ project.title }}</div>
          <q-separator spaced />
          <div class="row">
            <div
              v-for="(related, index) in relatedMedia"
              :key="related.id"
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm">
              <MediaPreview
                :channel="channel"
                :project="project"
                :media="related"
                :to="`/${channel.uuid}/${channel.slug}/${project.slug}/${related.slug}`"
                :priority="index === 0 ? 'high' : 'auto'" />
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoading } from '@composables/useChannelLoading.js'

import BreadCrumbs from '@components/shared/BreadCrumbs.vue'
import MediaPreview from '@components/channel/MediaPreview.vue'
import PlyrPlayer from '@components/channel/ProjectRoot/PlyrPlayer.vue'
import MediaDescription from '@components/channel/ProjectRoot/MediaDescription.vue'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const route = useRoute()
const router = useRouter()

const { channel, loading } = useChannelLoading()

function redirect(pathOrObj) {
  setTimeout(() => router.replace(pathOrObj), 0)
}

function findProjectByParams() {
  if (route.params.uuid) {
    return channel.value?.projects?.find(p => p.slug === route.params.projectSlug) || null
  }
  if (route.params.privateId && channel.value) {
    return channel.value?.project || null
  }
  return null
}

function findMediaByParams(project) {
  if (!project) return null

  if (route.params.privateId) {
    return project.media || null
  }
  if (route.params.mediaSlug) {
    return project.media?.find(m => m.slug === route.params.mediaSlug) || null
  }
  // Default to main media or first available
  return project.media?.find(m => m.main) || project.media?.[0] || null
}

function shouldRedirect404() {
  return !loading.value && channel.value && channel.value.uuid === route.params.uuid
}

const project = computed(() => {
  const p = findProjectByParams()
  if (!p && shouldRedirect404()) {
    redirect('/404')
  }
  return p
})

const media = computed(() => {
  const m = findMediaByParams(project.value)
  if (!m && shouldRedirect404()) {
    redirect('/404')
  }
  return m
})

const relatedMedia = computed(() => {
  return (project.value?.media || []).filter(m => m.id !== media.value?.id)
})
const hasRelatedContent = computed(() => !!route.params.uuid && relatedMedia.value.length > 0)

watch(
  project,
  newProject => {
    if (channel.value && !newProject && route.params.uuid && !loading.value) {
      redirect('/404')
    }
  },
  { immediate: true }
)

watch(
  media,
  newMedia => {
    if (
      channel.value &&
      project.value &&
      (project.value.media?.length || 0) > 0 &&
      !newMedia &&
      !loading.value
    ) {
      redirect('/404')
    } else if (newMedia && !route.params.mediaSlug) {
      redirect({ params: { ...route.params, mediaSlug: newMedia.slug } })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.plyrplayer {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}

.skeleton-large {
  width: 100%;
  max-width: 720px;
  height: 406px;
}
</style>
