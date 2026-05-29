<template>
  <div class="q-pa-md" data-cy="album-root">
    <div v-if="contentState === 'loading'">
      <q-skeleton type="rect" class="q-mb-md skeleton-large" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="40%" />
    </div>

    <div v-else-if="contentState === 'ready'">
      <BreadCrumbs
        :channel="channel"
        :album="album"
        :media="null"
        :route-context="routeContext" />

      <template v-if="displayState === 'empty'">
        <NothingText text="No content available." />
      </template>

      <template v-else-if="displayState === 'all-list'">
        <div class="row q-pt-md">
          <div
            v-for="card in allMediaCards"
            :key="card.id"
            class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm text-center">
            <MediaPreview
              :channel="channel"
              :album="album"
              :media="card.media"
              :to="card.to"
              :detail="true"
              :priority="card.priority" />
          </div>
        </div>
      </template>

      <template v-else-if="displayState === 'redirecting'">
        <q-skeleton type="rect" class="q-mb-md skeleton-large" />
        <q-skeleton type="text" width="60%" />
        <q-skeleton type="text" width="40%" />
      </template>

      <template v-else>
        <template v-if="showFeaturedSection">
          <div class="q-pt-md text-h6" data-cy="featured-media-title">Featured</div>
          <q-separator spaced />
          <div class="row">
            <div
              v-for="card in featuredMediaCards"
              :key="card.id"
              class="col-xs-12 col-sm-6 col-md-4 q-pa-sm">
              <MediaPreview
                :channel="channel"
                :album="album"
                :media="card.media"
                :to="card.to"
                :detail="true"
                :priority="card.priority" />
            </div>
          </div>
        </template>

        <template v-if="showOtherSection">
          <div class="q-pt-md text-h6" data-cy="other-media-title">More from {{ album.title }}</div>
          <q-separator spaced />
          <div class="row">
            <div
              v-for="card in otherMediaCards"
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
      </template>

      <ShareActions
        :channel="channel"
        :album="album"
        :route-context="routeContext" />
    </div>

    <template v-else>
      <NothingText text="Album not found or unavailable." />
    </template>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'
import { useAlbumRootViewModel } from '@composables/useAlbumRootViewModel.js'
import { useAlbumRouteEntities } from '@composables/useChannelRouteEntities.js'
import { useAlbumRootRouteOrchestrator } from '@composables/useChannelRouteOrchestrator.js'
import { resolveChannelRouteContext } from '@utils/channel-route.js'

import BreadCrumbs from '@components/channel/shared/BreadCrumbs.vue'
import ShareActions from '@components/channel/shared/ShareActions.vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const route = useRoute()
const router = useRouter()
const redirecting = ref(false)

const { channel, loading, findAlbumByPublicId } = useChannelLoader()

const routeContext = computed(() => resolveChannelRouteContext(route))

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

const { album } = useAlbumRouteEntities({
  channel,
  routeContext,
  findAlbumByPublicId
})
const {
  contentState,
  featuredMedia,
  featuredMediaCount,
  displayState,
  allMediaCards,
  featuredMediaCards,
  otherMediaCards,
  showFeaturedSection,
  showOtherSection
} = useAlbumRootViewModel({
  loading,
  channel,
  album,
  routeContext
})

useAlbumRootRouteOrchestrator({
  channel,
  album,
  loading,
  routeContext,
  featuredMedia,
  featuredMediaCount,
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
