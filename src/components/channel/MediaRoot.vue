<template>
  <div class="q-pa-md" data-cy="media-root">
    <template v-if="loading">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </template>

    <template v-else-if="channel && album && media && (route.params.privateMediaId || route.params.mediaId)">
      <BreadCrumbs
        :channel="channel"
        :album="album"
        :media="media"
        :private="!!route.params.privateMediaId"
        :private-scope="route.params.privateAlbumId ? 'album' : 'media'" />

      <PlyrPlayer
        :media="media"
        :artist="channel?.ownerName"
        class="q-py-md plyrplayer" />
      <div class="plyrplayer" data-cy="media-description-container">
        <MediaDescription
          :media="media"
          :poster="albumPoster"
          :poster-color="albumPosterColor" />
      </div>

      <template v-if="hasRelatedContent">
        <div class="q-pt-md text-h6" data-cy="related-media-title">More from {{ album.title }}</div>
        <q-separator spaced />
        <div class="row">
          <div
            v-for="(related, index) in relatedMedia"
            :key="related.id"
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm">
            <MediaPreview
              :channel="channel"
              :album="album"
              :media="related"
              :to="getRelatedPath(related)"
              :priority="index === 0 ? 'high' : 'auto'" />
          </div>
        </div>
      </template>

      <ShareActions
        :channel="channel"
        :album="album"
        :media="media"
        :private="!!route.params.privateMediaId"
        :private-scope="route.params.privateAlbumId ? 'album' : 'media'" />
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

function findAlbumByParams() {
  if (route.params.mediaId) {
    return channelStore.findAlbumByMediaPublicId(route.params.mediaId)
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
  if (route.params.mediaId) {
    return channelStore.findMediaByPublicId(route.params.mediaId)
  }
  return null
}

const album = computed(() => {
  return findAlbumByParams()
})

const media = computed(() => {
  return findMediaByParams(album.value)
})

const albumPoster = computed(() => album.value?.poster || null)
const albumPosterColor = computed(() => album.value?.posterColor || null)

const relatedMedia = computed(() => {
  return (album.value?.media || []).filter(m => (m.id || m.privateId) !== (media.value?.id || media.value?.privateId))
})

const hasRelatedContent = computed(() => {
  const isPublicMedia = !!route.params.mediaId
  const isPrivateAlbumMedia = !!route.params.privateAlbumId && !!route.params.privateMediaId
  return (isPublicMedia || isPrivateAlbumMedia) && relatedMedia.value.length > 0
})

function getRelatedPath(related) {
  if (route.params.privateAlbumId) {
    return `/private/a/${route.params.privateAlbumId}/m/${related.privateId}/${related.slug}`
  }
  return `/m/${related.publicId}/${related.slug}`
}

watch(
  album,
  newAlbum => {
    if (channel.value && !newAlbum && (route.params.mediaId || route.params.privateMediaId) && !loading.value) {
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
    if (route.params.mediaId && route.params.mediaSlug && newMedia.slug !== route.params.mediaSlug) {
      redirect(`/m/${newMedia.publicId}/${newMedia.slug}`)
      return
    }
    if (route.params.privateMediaId && route.params.mediaSlug && newMedia.slug !== route.params.mediaSlug) {
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
