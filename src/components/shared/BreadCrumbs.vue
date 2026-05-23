<template>
  <nav class="breadcrumb-nav" data-cy="breadcrumbs">
    <div
      class="row items-start q-pa-md"
      :class="$q.screen.lt.sm ? 'q-gutter-sm' : 'q-gutter-md'">
      <q-avatar
        class="self-start"
        :size="$q.screen.lt.sm ? '32px' : '40px'">
        <img
          :src="channel.cover"
          :alt="channel.title || media?.title || 'Video cover'"
          loading="lazy"
          decoding="async" />
      </q-avatar>
      <div class="col">
        <q-breadcrumbs
          class="breadcrumbs-list"
          active-color="primary"
          data-cy="breadcrumbs-list">
          <template #separator>
            <q-icon
              size="1.5em"
              name="chevron_right"
              color="primary" />
          </template>
          <q-breadcrumbs-el
            v-for="location in breadcrumbs"
            :class="$q.screen.gt.xs ? 'text-h5' : 'text-subtitle1'"
            :key="location.id"
            :label="location.label"
            :to="location.to" />
        </q-breadcrumbs>
        <div class="text-caption">By {{ channel.ownerName }}</div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({
  channel: { type: Object, required: true },
  album: { type: Object, default: null },
  media: { type: Object, default: null },
  private: { type: Boolean, default: false },
  privateScope: { type: String, default: 'media' }
})

const buildPrivateAlbumBreadcrumbs = () => {
  const arr = []
  if (props.album?.privateId) {
    arr.push({
      id: 'private-album',
      label: props.album?.title || 'Private Album',
      to: props.media?.privateId ? `/private/a/${props.album.privateId}/${props.album.slug}` : null,
    })
  }
  if (props.media?.privateId && props.album?.privateId) {
    arr.push({
      id: 'private-album-media',
      label: props.media?.title || 'Private Video',
      to: null,
    })
  }
  if (arr.length) {
    arr[arr.length - 1].to = null
  }
  return arr
}

const buildPublicBreadcrumbs = () => {
  const arr = []
  if (!props.channel) return arr
  arr.push({
    id: 0,
    label: props.channel.title,
    to: props.album?.id || props.media?.id ? `/c/${props.channel.publicId}/${props.channel.slug}` : null,
  })
  if (props.album?.id) {
    arr.push({
      id: 1,
      label: props.album.title,
      to: props.media?.id ? `/a/${props.album.publicId}/${props.album.slug}` : null,
    })
  }
  if (props.album?.id && props.media?.id) {
    arr.push({
      id: 2,
      label: props.media.title,
      to: null,
    })
  }
  return arr
}

const breadcrumbs = computed(() => {
  if (props.private) {
    if (props.privateScope === 'album') {
      return buildPrivateAlbumBreadcrumbs()
    }

    return [
      {
        id: 'private-media',
        label: props.media?.title || 'Private Video',
        to: null,
      }
    ]
  }

  return buildPublicBreadcrumbs()
})
</script>

<style scoped>
.breadcrumb-nav .row {
  flex-wrap: nowrap;
}

.col {
  min-width: 0;
}

.breadcrumbs-list {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;
}

.breadcrumbs-list::-webkit-scrollbar {
  display: none;
}

.breadcrumbs-list :deep(.q-breadcrumbs__el),
.breadcrumbs-list :deep(.q-breadcrumbs__el .ellipsis) {
  white-space: nowrap;
}
</style>
