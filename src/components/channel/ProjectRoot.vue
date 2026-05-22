<template>
  <div class="q-pa-md" data-cy="project-root">
    <template v-if="loading">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </template>

    <template v-else-if="channel && project && (route.params.projectId || route.params.privateProjectId)">
      <BreadCrumbs
        :channel="channel"
        :project="project"
        :media="null"
        :private="privateMode"
        private-scope="project" />

      <!-- Scenario 1: No featured media - show list view -->
      <template v-if="featuredMediaCount === 0">
        <NothingText v-if="allMedia.length === 0" text="No content available." />
        <template v-else>
          <div class="row q-pt-md">
            <div
              v-for="(item, index) in allMedia"
              :key="item.id"
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm text-center">
              <MediaPreview
                :channel="channel"
                :project="project"
                :media="item"
                :to="getMediaPath(item)"
                :detail="true"
                :showMainAccent="false"
                :priority="index === 0 ? 'high' : 'auto'" />
            </div>
          </div>
        </template>
      </template>

      <!-- Scenario 2: Exactly one featured media - redirect to MediaRoot -->
      <template v-else-if="featuredMediaCount === 1">
        <q-skeleton type="rect" class="q-mb-md skeleton-large" />
        <q-skeleton type="text" width="60%" />
        <q-skeleton type="text" width="40%" />
      </template>

      <!-- Scenario 3: Multiple featured media -->
      <template v-else>
        <!-- Featured media section (2+) -->
        <template v-if="featuredMediaCount > 1">
          <div class="q-pt-md text-h6" data-cy="featured-media-title">Featured</div>
          <q-separator spaced />
          <div class="row">
            <div
              v-for="(item, index) in featuredMedia"
              :key="item.id"
              class="col-xs-12 col-sm-6 col-md-4 q-pa-sm">
              <MediaPreview
                :channel="channel"
                :project="project"
                :media="item"
                :to="getMediaPath(item)"
                :detail="true"
                :showMainAccent="false"
                :priority="index === 0 ? 'high' : 'auto'" />
            </div>
          </div>
        </template>

        <!-- Other media section -->
        <template v-if="otherMedia.length > 0">
          <div class="q-pt-md text-h6" data-cy="other-media-title">More from {{ project.title }}</div>
          <q-separator spaced />
          <div class="row">
            <div
              v-for="(related, index) in otherMedia"
              :key="related.id"
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm">
              <MediaPreview
                :channel="channel"
                :project="project"
                :media="related"
                :to="getMediaPath(related)"
                :priority="index === 0 ? 'high' : 'auto'" />
            </div>
          </div>
        </template>
      </template>

      <ShareActions
        :channel="channel"
        :project="project"
        :private="privateMode"
        private-scope="project" />
    </template>

    <template v-else>
      <NothingText text="Project not found or unavailable." />
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
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const route = useRoute()
const router = useRouter()
const redirecting = ref(false)
const channelStore = useChannelStore()

const { channel, loading } = useChannelLoader()

const privateMode = computed(() => !!route.params.privateProjectId)

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

function findProjectByParams() {
  if (route.params.privateProjectId) {
    return channel.value?.project || null
  }
  if (route.params.projectId) {
    return channelStore.findProjectByPublicId(route.params.projectId)
  }
  return null
}

function getMediaPath(media) {
  if (privateMode.value && route.params.privateProjectId) {
    return `/private/p/${route.params.privateProjectId}/m/${media.privateId}/${media.slug}`
  }
  return `/m/${media.publicId}/${media.slug}`
}

const project = computed(() => {
  return findProjectByParams()
})

const allMedia = computed(() => {
  return project.value?.media || []
})

const featuredMedia = computed(() => {
  return allMedia.value.filter(m => m.main === true)
})

const featuredMediaCount = computed(() => {
  return featuredMedia.value.length
})

const otherMedia = computed(() => {
  return allMedia.value.filter(m => m.main !== true)
})

watch(
  project,
  newProject => {
    if (channel.value && newProject && route.params.projectSlug && newProject.slug !== route.params.projectSlug && !loading.value) {
      if (privateMode.value && newProject.privateId) {
        redirect(`/private/p/${newProject.privateId}/${newProject.slug}`)
      } else {
        redirect(`/p/${newProject.publicId}/${newProject.slug}`)
      }
      return
    }
    if (channel.value && !newProject && (route.params.projectId || route.params.privateProjectId) && !loading.value) {
      redirect('/404')
    }
  },
  { immediate: true }
)

// If exactly one featured media and we're on the project (not media) route, 
// redirect to the media route to use MediaRoot instead
watch(
  [featuredMediaCount, project, loading],
  ([count, proj, isLoading]) => {
    if (!isLoading && channel.value && proj && count === 1 && (route.params.projectId || route.params.privateProjectId)) {
      const featured = featuredMedia.value[0]
      if (privateMode.value && route.params.privateProjectId && featured?.privateId) {
        redirect(`/private/p/${route.params.privateProjectId}/m/${featured.privateId}/${featured.slug}`)
      } else {
        redirect(`/m/${featured.publicId}/${featured.slug}`)
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
