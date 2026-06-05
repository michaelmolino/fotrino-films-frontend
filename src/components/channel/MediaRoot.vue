<template>
  <div class="q-pa-md" data-cy="media-root">
    <div v-if="contentState === 'loading'">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </div>

    <div v-else-if="contentState === 'ready'">
      <BreadCrumbs :channel="channel" :album="album" :media="media" :route-context="routeContext" />

      <PlyrPlayer :media="media" :artist="channel.ownerName" class="q-py-md plyrplayer" />
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
        :route-context="routeContext" />
    </div>

    <template v-else>
      <NothingText text="Video not found or unavailable." />
    </template>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'
import { useMediaRootViewModel } from '@composables/useMediaRootViewModel.js'
import { useMediaRouteEntities } from '@composables/useChannelRouteEntities.js'
import { useMediaRootRouteOrchestrator } from '@composables/useChannelRouteOrchestrator.js'

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

const router = useRouter()
const redirecting = ref(false)

const { channel, loading, findAlbumByMediaPublicId, findMediaByPublicId, routeContext } =
  useChannelLoader()

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

const { album, media } = useMediaRouteEntities({
  channel,
  routeContext,
  findAlbumByMediaPublicId,
  findMediaByPublicId
})
const { contentState, albumPoster, albumPosterColor, showRelatedContent, relatedCards } =
  useMediaRootViewModel({
    loading,
    channel,
    album,
    media,
    routeContext
  })

useMediaRootRouteOrchestrator({
  channel,
  album,
  media,
  loading,
  routeContext,
  redirect
})
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
