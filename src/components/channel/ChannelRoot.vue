<template>
  <div class="channel-root">
    <div v-if="contentState === 'loading'">
      <div class="row items-start q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" v-for="n in 6" :key="n">
          <q-skeleton type="rect" class="q-mb-sm skeleton-medium" />
          <q-skeleton type="text" width="80%" />
          <q-skeleton type="text" width="60%" />
        </div>
      </div>
    </div>

    <div v-else-if="contentState === 'ready'">
      <div :key="channel?.publicId || route.fullPath">
        <div ref="headerRowRef" class="row items-center q-mb-sm channel-header">
          <div ref="breadcrumbsRef" class="channel-header-breadcrumbs">
            <BreadCrumbs :channel="channel" :album="null" :media="null" />
          </div>
          <q-space />
          <div
            ref="viewToggleRef"
            class="channel-view-toggle"
            :class="{ 'channel-view-toggle--wrapped': isViewToggleWrapped }">
            <ViewToggle v-model="selectedView" :albumCount="albumCount" :allCount="allCount" />
          </div>
        </div>

        <q-separator spaced />

        <template v-if="showAlbumsView">
          <div class="row q-mt-sm albums-grid-row">
            <div
              class="col-xs-6 col-sm-4 col-md-3 col-lg-2"
              v-for="card in albumCards"
              :key="card.id">
              <AlbumPoster :album="card.album" :to="card.to" />
            </div>
            <NothingText v-if="showEmptyContent" text="No content available." />
          </div>
        </template>

        <template v-else>
          <div class="row q-pt-md media-grid-row">
            <div
              class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm text-center"
              v-for="card in mediaCards"
              :key="card.id">
              <MediaPreview
                :channel="channel"
                :album="card.album"
                :media="card.media"
                :to="card.to"
                :detail="true"
                :priority="card.priority" />
            </div>
            <NothingText v-if="showEmptyContent" text="No content available." />
          </div>
        </template>

        <ShareActions :channel="channel" />
      </div>
    </div>

    <template v-else>
      <NothingText text="Channel not found or unavailable." />
    </template>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getViewPreference, setViewPreference } from '@utils/viewPreference.js'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'
import { useChannelRootViewModel } from '@composables/useChannelRootViewModel.js'

import BreadCrumbs from '@components/channel/shared/BreadCrumbs.vue'
import ShareActions from '@components/channel/shared/ShareActions.vue'
import AlbumPoster from '@components/channel/shared/AlbumPoster.vue'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'
import ViewToggle from './ChannelRoot/ViewToggle.vue'
const NothingText = defineAsyncComponent(() => import('@components/shared/NothingText.vue'))

const route = useRoute()
const router = useRouter()
const redirecting = ref(false)
const selectedView = ref(getViewPreference('all'))
const headerRowRef = ref(null)
const breadcrumbsRef = ref(null)
const viewToggleRef = ref(null)
const isViewToggleWrapped = ref(false)
let headerResizeObserver = null
const { channel, sortedAllMedia, loading } = useChannelLoader()
const {
  albums,
  contentState,
  showAlbumsView,
  albumCards,
  mediaCards,
  showEmptyContent,
  albumCount,
  allCount
} = useChannelRootViewModel({
  loading,
  channel,
  route,
  selectedView,
  sortedAllMedia
})

function updateViewToggleWrapState() {
  if (!breadcrumbsRef.value || !viewToggleRef.value) {
    isViewToggleWrapped.value = false
    return
  }

  const breadcrumbsTop = breadcrumbsRef.value.offsetTop
  const toggleTop = viewToggleRef.value.offsetTop
  isViewToggleWrapped.value = toggleTop > breadcrumbsTop
}

function redirect(pathOrObj) {
  if (redirecting.value) return
  redirecting.value = true
  router.replace(pathOrObj)
}

watch(selectedView, val => {
  const normalized = val === 'albums' || val === 'all' ? val : 'all'
  if (normalized !== val) {
    selectedView.value = normalized
    return
  }
  setViewPreference(normalized)
})

onMounted(() => {
  nextTick(updateViewToggleWrapState)

  if (typeof ResizeObserver !== 'undefined') {
    headerResizeObserver = new ResizeObserver(() => {
      updateViewToggleWrapState()
    })

    if (headerRowRef.value) headerResizeObserver.observe(headerRowRef.value)
    if (breadcrumbsRef.value) headerResizeObserver.observe(breadcrumbsRef.value)
    if (viewToggleRef.value) headerResizeObserver.observe(viewToggleRef.value)
  }

  window.addEventListener('resize', updateViewToggleWrapState)
})

onBeforeUnmount(() => {
  if (headerResizeObserver) {
    headerResizeObserver.disconnect()
    headerResizeObserver = null
  }
  window.removeEventListener('resize', updateViewToggleWrapState)
})

watch(
  [albumCount, channel, loading],
  ([count, currentChannel, isLoading]) => {
    if (isLoading || !currentChannel || !route.params.channelPublicId || count !== 1) return
    const onlyAlbum = albums.value[0]
    if (!onlyAlbum?.publicId || !onlyAlbum?.slug) return
    redirect(`/a/${onlyAlbum.publicId}/${onlyAlbum.slug}`)
  },
  { immediate: true }
)

watch([loading, channel, selectedView, albumCount, allCount], () => {
  nextTick(updateViewToggleWrapState)
})
</script>

<style scoped>
.channel-root {
  padding: 16px;
}

.skeleton-medium {
  width: 100%;
  height: 200px;
}

.channel-header {
  row-gap: 8px;
}

.channel-view-toggle {
  margin-left: auto;
}

.channel-view-toggle--wrapped {
  margin-left: auto;
  margin-right: auto;
}

@media (orientation: landscape) and (max-height: 460px) {
  .channel-root {
    padding: 8px;
  }

  .channel-header {
    row-gap: 4px;
    margin-bottom: 4px;
  }

  .albums-grid-row {
    margin-top: 4px;
  }

  .media-grid-row {
    padding-top: 6px;
  }
}
</style>
