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
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

const props = defineProps({
  channel: { type: Object, required: true },
  album: { type: Object, default: null },
  media: { type: Object, default: null },
  routeContext: { type: Object, default: null }
})

const isPrivate = computed(() => Boolean(props.routeContext?.isPrivate))
const privateScope = computed(() => props.routeContext.privateScope)
const channelCoverIcon = computed(() => `img:${resolveImagePrimaryUrl(props.channel.coverAsset)}`)

const breadcrumbs = computed(() => {
  if (isPrivate.value) {
    if (privateScope.value === 'album') {
      const isPrivateAlbumMediaRoute = props.routeContext.type === 'privateAlbumMedia'
      const privateAlbumBreadcrumbs = [
        {
          id: 'private-album',
          label: props.album.title,
          to: isPrivateAlbumMediaRoute ? props.album.canonicalPath.privatePath : null
        }
      ]

      if (isPrivateAlbumMediaRoute) {
        privateAlbumBreadcrumbs.push({
          id: 'private-album-media',
          label: props.media.title,
          to: null
        })
      }

      privateAlbumBreadcrumbs[privateAlbumBreadcrumbs.length - 1].to = null
      return privateAlbumBreadcrumbs
    }

    return [
      {
        id: 'private-media',
        label: props.media.title,
        to: null
      }
    ]
  }

  const publicBreadcrumbs = [
    {
      id: 0,
      icon: channelCoverIcon.value,
      label: props.channel.title,
      to:
        props.album?.publicId || props.media?.publicId
          ? `/c/${props.channel.publicId}/${props.channel.slug}`
          : null
    }
  ]

  if (props.album?.publicId) {
    publicBreadcrumbs.push({
      id: 1,
      label: props.album.title,
      to: props.media?.publicId ? props.album.canonicalPath.publicPath : null
    })
  }

  if (props.album?.publicId && props.media?.publicId) {
    publicBreadcrumbs.push({
      id: 2,
      label: props.media.title,
      to: null
    })
  }

  return publicBreadcrumbs
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
