<template>
  <div class="q-pa-md" data-cy="media-root">
    <template v-if="loading">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </template>

    <template v-else-if="channel && project && media && (route.params.privateMediaId || route.params.mediaId)">
      <BreadCrumbs
        :channel="channel"
        :project="project"
        :media="media"
        :private="!!route.params.privateMediaId"
        :private-scope="route.params.privateProjectId ? 'project' : 'media'" />

      <PlyrPlayer
        :media="media"
        :artist="channel?.ownerName"
        class="q-py-md plyrplayer" />
      <div class="plyrplayer" data-cy="media-description-container">
        <MediaDescription
          :media="media"
          :poster="projectPoster"
          :poster-color="projectPosterColor" />
      </div>

      <template v-if="hasRelatedContent">
        <div class="q-pt-md text-h6" data-cy="related-media-title">More from {{ project.title }}</div>
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
              :to="getRelatedPath(related)"
              :priority="index === 0 ? 'high' : 'auto'" />
          </div>
        </div>
      </template>

      <ShareActions
        :channel="channel"
        :project="project"
        :media="media"
        :private="!!route.params.privateMediaId"
        :private-scope="route.params.privateProjectId ? 'project' : 'media'" />
    </template>

    <template v-else>
      <NothingText text="Media not found or unavailable." />
    </template>
  </div>
</template>

<script setup>
import { computed, watch, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'
import { useChannelStore } from 'src/stores/channel-store.js'

import BreadCrumbs from '@components/shared/BreadCrumbs.vue'
import ShareActions from '@components/shared/ShareActions.vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
import PlyrPlayer from '@components/channel/MediaRoot/PlyrPlayer.vue'
import MediaDescription from '@components/channel/MediaRoot/MediaDescription.vue'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const route = useRoute()
const router = useRouter()
const redirecting = ref(false)
const channelStore = useChannelStore()

const { channel, loading } = useChannelLoader()

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

function findProjectByParams() {
  if (route.params.mediaId) {
    return channelStore.findProjectByMediaPublicId(route.params.mediaId)
  }
  if (route.params.privateProjectId && channel.value) {
    return channel.value?.project || null
  }
  if (route.params.privateMediaId && channel.value) {
    return channel.value?.project || null
  }
  return null
}

function findMediaByParams(project) {
  if (!project) return null

  if (route.params.privateProjectId && route.params.privateMediaId) {
    return project.media.find(item => item?.privateId === route.params.privateMediaId) || null
  }

  if (route.params.privateMediaId) {
    return project.media.find(item => item?.privateId === route.params.privateMediaId) || null
  }
  if (route.params.mediaId) {
    return channelStore.findMediaByPublicId(route.params.mediaId)
  }
  return null
}

const project = computed(() => {
  return findProjectByParams()
})

const media = computed(() => {
  return findMediaByParams(project.value)
})

const projectPoster = computed(() => project.value?.poster || null)
const projectPosterColor = computed(() => project.value?.posterColor || null)

const relatedMedia = computed(() => {
  return project.value.media.filter(m => (m.id || m.privateId) !== (media.value?.id || media.value?.privateId))
})

const hasRelatedContent = computed(() => {
  const isPublicMedia = !!route.params.mediaId
  const isPrivateProjectMedia = !!route.params.privateProjectId && !!route.params.privateMediaId
  return (isPublicMedia || isPrivateProjectMedia) && relatedMedia.value.length > 0
})

function getRelatedPath(related) {
  if (route.params.privateProjectId) {
    return `/private/p/${route.params.privateProjectId}/m/${related.privateId}/${related.slug}`
  }
  return `/m/${related.publicId}/${related.slug}`
}

watch(
  project,
  newProject => {
    if (channel.value && !newProject && (route.params.mediaId || route.params.privateMediaId) && !loading.value) {
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
    }
  },
  { immediate: true }
)

watch(
  media,
  newMedia => {
    if (!newMedia || loading.value) return
    if (route.params.mediaId && route.params.mediaSlug && newMedia.slug !== route.params.mediaSlug) {
      redirect(`/m/${newMedia.publicId}/${newMedia.slug}`)
      return
    }
    if (route.params.privateMediaId && route.params.mediaSlug && newMedia.slug !== route.params.mediaSlug) {
      if (route.params.privateProjectId && project.value?.privateId && newMedia.privateId) {
        redirect(`/private/p/${project.value.privateId}/m/${newMedia.privateId}/${newMedia.slug}`)
        return
      }
      if (newMedia.privateId) {
        redirect(`/private/m/${newMedia.privateId}/${newMedia.slug}`)
      }
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
