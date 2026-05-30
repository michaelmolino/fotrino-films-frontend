<template>
  <nav class="breadcrumb-nav" data-cy="breadcrumbs">
    <div class="q-pa-md">
      <q-breadcrumbs class="breadcrumbs-list" active-color="primary" data-cy="breadcrumbs-list">
        <template #separator>
          <q-icon size="1.5em" name="chevron_right" color="primary" />
        </template>
        <q-breadcrumbs-el
          v-for="location in breadcrumbs"
          class="text-subtitle1"
          :key="location.id"
          :icon="location.icon"
          :label="location.label"
          :to="location.to" />
      </q-breadcrumbs>
      <div class="text-caption">By {{ channel.ownerName }}</div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { buildAlbumPath, buildChannelPath, buildPrivateAlbumPath } from '@utils/channel-route.js'

const props = defineProps({
  channel: { type: Object, required: true },
  album: { type: Object, default: null },
  media: { type: Object, default: null },
  routeContext: { type: Object, default: null }
})

const isPrivate = computed(() => Boolean(props.routeContext?.isPrivate))
const privateScope = computed(() => props.routeContext?.privateScope || 'media')

function withLastCrumbCurrent(items) {
  if (items.length > 0) {
    items[items.length - 1].to = null
  }
  return items
}

const buildPrivateAlbumBreadcrumbs = () => {
  const arr = []
  if (props.album?.privateId) {
    arr.push({
      id: 'private-album',
      label: props.album?.title || 'Private Album',
      to:
        props.media?.privateId
          ? buildPrivateAlbumPath({ privateId: props.album.privateId, slug: props.album.slug })
          : null
    })
  }
  if (props.media?.privateId && props.album?.privateId) {
    arr.push({
      id: 'private-album-media',
      label: props.media?.title || 'Private Video',
      to: null
    })
  }
  return withLastCrumbCurrent(arr)
}

const buildPublicBreadcrumbs = () => {
  const arr = []
  if (!props.channel) return arr
  arr.push({
    id: 0,
    icon: `img:${props.channel.cover}`,
    label: props.channel.title,
    to:
      props.album?.publicId || props.media?.publicId
        ? buildChannelPath({ publicId: props.channel.publicId, slug: props.channel.slug })
        : null
  })
  if (props.album?.publicId) {
    arr.push({
      id: 1,
      label: props.album.title,
      to:
        props.media?.publicId
          ? buildAlbumPath({ publicId: props.album.publicId, slug: props.album.slug })
          : null
    })
  }
  if (props.album?.publicId && props.media?.publicId) {
    arr.push({
      id: 2,
      label: props.media.title,
      to: null
    })
  }
  return arr
}

const breadcrumbs = computed(() => {
  if (isPrivate.value) {
    if (privateScope.value === 'album') {
      return buildPrivateAlbumBreadcrumbs()
    }

    return [
      {
        id: 'private-media',
        label: props.media?.title || 'Private Video',
        to: null
      }
    ]
  }

  return buildPublicBreadcrumbs()
})
</script>

<style scoped>
.breadcrumbs-list {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding-bottom: 2px;
}

.breadcrumbs-list::-webkit-scrollbar {
  height: 6px;
}

.breadcrumbs-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
}
</style>
