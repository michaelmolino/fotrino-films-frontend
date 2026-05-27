<template>
  <div class="q-pa-md" data-cy="media-root">
    <div v-if="contentState === 'loading'">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </div>

    <div v-else-if="contentState === 'ready'">
      <BreadCrumbs
        :channel="channel"
        :album="album"
        :media="media"
        :private="privateMode"
        :private-scope="privateScope" />

      <PlyrPlayer :media="media" :artist="channel?.ownerName" class="q-py-md plyrplayer" />
      <div class="plyrplayer" data-cy="media-description-container">
        <MediaDescription :media="media" :poster="albumPoster" :poster-color="albumPosterColor" />
      </div>

      <template v-if="showRelatedContent">
        <div class="q-pt-md text-h6" data-cy="related-media-title">More from {{ album.title }}</div>
        <q-separator spaced />
        <div class="row">
          <div
            v-for="card in relatedCards"
            :key="card.id"
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm">
            <MediaPreview
              :channel="channel"
              :album="album"
              :media="card.media"
              :to="card.to"
              :priority="card.priority" />
          </div>
        </div>
      </template>

      <ShareActions
        :channel="channel"
        :album="album"
        :media="media"
        :private="privateMode"
        :private-scope="privateScope" />
    </div>

    <template v-else>
      <NothingText text="Video not found or unavailable." />
    </template>
  </div>
</template>

<script setup>
import { computed, watch, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'
import { useMediaRootViewModel } from '@composables/useMediaRootViewModel.js'

import BreadCrumbs from '@components/channel/shared/BreadCrumbs.vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'

const ShareActions = defineAsyncComponent(
  () => import('@components/channel/shared/ShareActions.vue')
)
const PlyrPlayer = defineAsyncComponent(
  () => import('@components/channel/MediaRoot/PlyrPlayer.vue')
)
const MediaDescription = defineAsyncComponent(
  () => import('@components/channel/MediaRoot/MediaDescription.vue')
)
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const route = useRoute()
const router = useRouter()
const redirecting = ref(false)

const { channel, loading, findAlbumByMediaPublicId, findMediaByPublicId } = useChannelLoader()

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

function findAlbumByParams() {
  if (route.params.mediaPublicId) {
    return findAlbumByMediaPublicId(route.params.mediaPublicId)
  }
  if (route.params.privateAlbumId && channel.value) {
    return channel.value?.album || null
  }
  if (route.params.privateMediaId && channel.value) {
    return channel.value?.album || null
  }
  return null
}

function findMediaByParams(album) {
  if (!album) return null
  const mediaItems = album.media || []

  if (route.params.privateAlbumId && route.params.privateMediaId) {
    return mediaItems.find(item => item?.privateId === route.params.privateMediaId) || null
  }

  if (route.params.privateMediaId) {
    return mediaItems.find(item => item?.privateId === route.params.privateMediaId) || null
  }
  if (route.params.mediaPublicId) {
    return findMediaByPublicId(route.params.mediaPublicId)
  }
  return null
}

const album = computed(() => {
  return findAlbumByParams()
})

const media = computed(() => {
  return findMediaByParams(album.value)
})
const {
  privateMode,
  privateScope,
  contentState,
  albumPoster,
  albumPosterColor,
  showRelatedContent,
  relatedCards
} = useMediaRootViewModel({
  loading,
  channel,
  album,
  media,
  route
})

watch(
  album,
  newAlbum => {
    if (
      channel.value &&
      !newAlbum &&
      (route.params.mediaPublicId || route.params.privateMediaId) &&
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
    if (
      channel.value &&
      album.value &&
      (album.value.media?.length || 0) > 0 &&
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
    if (
      route.params.mediaPublicId &&
      route.params.mediaSlug &&
      newMedia.slug !== route.params.mediaSlug
    ) {
      redirect(`/m/${newMedia.publicId}/${newMedia.slug}`)
      return
    }
    if (
      route.params.privateMediaId &&
      route.params.mediaSlug &&
      newMedia.slug !== route.params.mediaSlug
    ) {
      if (route.params.privateAlbumId && album.value?.privateId && newMedia.privateId) {
        redirect(`/private/a/${album.value.privateId}/m/${newMedia.privateId}/${newMedia.slug}`)
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
