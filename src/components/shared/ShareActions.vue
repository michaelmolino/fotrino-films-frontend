<template>
  <div v-if="primaryAction" ref="containerRef" class="share-actions-floating">
    <q-btn
      icon="share"
      :round="true"
      :unelevated="true"
      size="md"
      color="info"
      aria-label="Share"
      data-cy="share-button"
      @click="toggleMenu">
      <q-tooltip>Share</q-tooltip>
    </q-btn>

    <q-card v-if="menuOpen" class="share-menu-panel" data-cy="share-menu-panel">
      <q-list class="share-menu-list">
        <q-item class="share-menu-header" dense>
          <q-item-section>
            <q-item-label class="share-menu-title">Share {{ shareTargetLabel }}</q-item-label>
            <q-item-label caption>Choose what people can access.</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />

        <q-item
          :key="primaryAction.key"
          clickable
          :data-cy="primaryAction.cy"
          @click="onAction(primaryAction.path)">
          <q-item-section avatar>
            <q-avatar :icon="primaryAction.icon" color="accent" text-color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ primaryAction.label }}</q-item-label>
            <q-item-label caption>{{ primaryAction.description }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="content_copy" color="accent" />
          </q-item-section>
        </q-item>

        <template v-if="advancedActions.length">
          <q-separator spaced />
          <q-item
            v-if="!showAdvanced"
            clickable
            data-cy="share-more-options"
            @click="showAdvanced = true">
            <q-item-section avatar>
              <q-avatar icon="expand_more" color="secondary" text-color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>More sharing options</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            v-for="action in showAdvanced ? advancedActions : []"
            :key="action.key"
            clickable
            :data-cy="action.cy"
            @click="onAction(action.path)">
            <q-item-section avatar>
              <q-avatar :icon="action.icon" color="accent" text-color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ action.label }}</q-item-label>
              <q-item-label caption>{{ action.description }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="content_copy" color="accent" />
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Notify, copyToClipboard } from 'quasar'

const props = defineProps({
  channel: { type: Object, required: true },
  album: { type: Object, default: null },
  media: { type: Object, default: null },
  private: { type: Boolean, default: false },
  privateScope: { type: String, default: 'media' }
})

const route = useRoute()
const showAdvanced = ref(false)
const menuOpen = ref(false)
const containerRef = ref(null)

const shareTargetLabel = computed(() => {
  if (props.media) return 'this video'
  if (props.album) return 'this album'
  return 'this channel'
})

const channelPath = computed(() => {
  if (!props.channel?.publicId || !props.channel?.slug) return null
  return `/c/${props.channel.publicId}/${props.channel.slug}`
})

const albumPath = computed(() => {
  if (!props.album?.publicId || !props.album?.slug) return null
  return `/a/${props.album.publicId}/${props.album.slug}`
})

const privateAlbumPath = computed(() => {
  if (!props.album?.privateId || !props.album?.slug) return null
  return `/private/a/${props.album.privateId}/${props.album.slug}`
})

const publicMediaPath = computed(() => {
  if (!props.media?.publicId || !props.media?.slug) return null
  return `/m/${props.media.publicId}/${props.media.slug}`
})

const privateMediaPath = computed(() => {
  if (!props.media?.privateId || !props.media?.slug) return null
  if (route.params?.privateAlbumId) {
    return `/private/a/${route.params.privateAlbumId}/m/${props.media.privateId}/${props.media.slug}`
  }
  if (props.album?.privateId) {
    return `/private/a/${props.album.privateId}/m/${props.media.privateId}/${props.media.slug}`
  }
  return `/private/m/${props.media.privateId}/${props.media.slug}`
})

const standalonePrivateMediaPath = computed(() => {
  if (!props.media?.privateId || !props.media?.slug) return null
  return `/private/m/${props.media.privateId}/${props.media.slug}`
})

const isPrivateAlbumContext = computed(() => {
  return Boolean(props.private || route.params?.privateAlbumId || (!albumPath.value && privateAlbumPath.value))
})

const shareForChannel = computed(() => {
  if (!channelPath.value) return []
  return [
    {
      key: 'share-channel',
      label: 'Entire channel',
      description: 'Recipient can browse everything in this channel.',
      icon: 'apps',
      path: channelPath.value,
      cy: 'share-channel'
    }
  ]
})

const shareForAlbum = computed(() => {
  const items = []

  if (privateAlbumPath.value) {
    items.push({
      key: 'share-album-private',
      label: 'This album',
      description: 'Recipient can browse videos in this album only.',
      icon: 'folder',
      path: privateAlbumPath.value,
      cy: 'share-only-album'
    })
  } else if (albumPath.value) {
    items.push({
      key: 'share-album-public',
      label: 'This album',
      description: 'Recipient can browse videos in this album.',
      icon: 'folder',
      path: albumPath.value,
      cy: 'share-only-album'
    })
  }

  if (isPrivateAlbumContext.value) {
    return items
  }

  if (channelPath.value) {
    items.push({
      key: 'share-album-channel',
      label: 'Entire channel',
      description: 'Recipient can browse everything in this channel.',
      icon: 'apps',
      path: albumPath.value || channelPath.value,
      cy: 'share-within-channel'
    })
  }

  return items
})

const shareForMedia = computed(() => {
  const items = []

  if (standalonePrivateMediaPath.value || privateMediaPath.value || publicMediaPath.value) {
    items.push({
      key: 'share-media-only',
      label: 'Only this video',
      description: 'Recipient can watch this video only.',
      icon: 'movie',
      path: standalonePrivateMediaPath.value || privateMediaPath.value || publicMediaPath.value,
      cy: 'share-only-video'
    })
  }

  if (privateAlbumPath.value) {
    items.push({
      key: 'share-media-album',
      label: 'This album',
      description: 'Recipient can browse related videos in this album.',
      icon: 'folder',
      path: privateMediaPath.value || privateAlbumPath.value,
      cy: 'share-within-album'
    })
  }

  if (channelPath.value && !isPrivateAlbumContext.value) {
    items.push({
      key: 'share-media-channel',
      label: 'Entire channel',
      description: 'Recipient can browse everything in this channel.',
      icon: 'apps',
      path: publicMediaPath.value || channelPath.value,
      cy: 'share-within-channel'
    })
  }
  return items
})

const actions = computed(() => {
  if (props.media) return shareForMedia.value
  if (props.album) return shareForAlbum.value
  return shareForChannel.value
})

const primaryAction = computed(() => {
  if (!actions.value.length) return null
  return actions.value[0]
})

const advancedActions = computed(() => {
  if (actions.value.length <= 1) return []
  return actions.value.slice(1)
})

function closeMenu() {
  menuOpen.value = false
  showAdvanced.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (!menuOpen.value) {
    showAdvanced.value = false
  }
}

function onAction(path) {
  copyLink(path)
  closeMenu()
}

function handleDocumentClick(event) {
  if (!menuOpen.value) return
  if (!containerRef.value) return
  const target = event.target
  if (target instanceof Node && !containerRef.value.contains(target)) {
    closeMenu()
  }
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})

function copyLink(path) {
  if (!path) return
  copyToClipboard(`${globalThis.location.origin}${path}`).then(() => {
    Notify.create({
      message: 'URL copied to clipboard',
      color: 'accent',
      icon: 'content_paste',
      timeout: 1000
    })
  })
}
</script>

<style scoped>
.share-actions-floating {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right));
  bottom: calc(64px + env(safe-area-inset-bottom));
  z-index: 1200;
}

.share-menu-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  min-width: 320px;
  max-width: min(420px, calc(100vw - 24px));
  z-index: 1300;
}

.share-menu-list {
  min-width: 320px;
}

.share-menu-header {
  pointer-events: none;
}

.share-menu-title {
  font-weight: 600;
}
</style>
