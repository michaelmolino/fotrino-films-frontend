<template>
  <div class="q-pa-md" data-cy="album-root">
    <template v-if="loading">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </template>

    <template v-else-if="channel && album && (route.params.albumId || route.params.privateAlbumId)">
      <BreadCrumbs
        :channel="channel"
        :album="album"
        :media="null"
        :private="privateMode"
        private-scope="album" />

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
                :album="album"
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
                :album="album"
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
          <div class="q-pt-md text-h6" data-cy="other-media-title">More from {{ album.title }}</div>
          <q-separator spaced />
          <div class="row">
            <div
              v-for="(related, index) in otherMedia"
              :key="related.id"
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm">
              <MediaPreview
                :channel="channel"
                :album="album"
                :media="related"
                :to="getMediaPath(related)"
                :priority="index === 0 ? 'high' : 'auto'" />
            </div>
          </div>
        </template>
      </template>

      <ShareActions
        :channel="channel"
        :album="album"
        :private="privateMode"
        private-scope="album" />
    </template>

    <template v-else>
      <NothingText text="Album not found or unavailable." />
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

const privateMode = computed(() => !!route.params.privateAlbumId)

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

function findAlbumByParams() {
  if (route.params.privateAlbumId) {
    return channel.value?.album || null
  }
  if (route.params.albumId) {
    return channelStore.findAlbumByPublicId(route.params.albumId)
  }
  return null
}

function getMediaPath(media) {
  if (privateMode.value && route.params.privateAlbumId) {
    return `/private/a/${route.params.privateAlbumId}/m/${media.privateId}/${media.slug}`
  }
  return `/m/${media.publicId}/${media.slug}`
}

const album = computed(() => {
  return findAlbumByParams()
})

const allMedia = computed(() => {
  return album.value?.media || []
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
  album,
  newAlbum => {
    if (channel.value && newAlbum && route.params.albumSlug && newAlbum.slug !== route.params.albumSlug && !loading.value) {
      if (privateMode.value && newAlbum.privateId) {
        redirect(`/private/a/${newAlbum.privateId}/${newAlbum.slug}`)
      } else {
        redirect(`/a/${newAlbum.publicId}/${newAlbum.slug}`)
      }
      return
    }
    if (channel.value && !newAlbum && (route.params.albumId || route.params.privateAlbumId) && !loading.value) {
      redirect('/404')
    }
  },
  { immediate: true }
)

// If exactly one featured media and we're on the album (not media) route, 
// redirect to the media route to use MediaRoot instead
watch(
  [featuredMediaCount, album, loading],
  ([count, proj, isLoading]) => {
    if (!isLoading && channel.value && proj && count === 1 && (route.params.albumId || route.params.privateAlbumId)) {
      const featured = featuredMedia.value[0]
      if (privateMode.value && route.params.privateAlbumId && featured?.privateId) {
        redirect(`/private/a/${route.params.privateAlbumId}/m/${featured.privateId}/${featured.slug}`)
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
