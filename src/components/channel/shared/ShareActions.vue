<template>
  <div v-if="primaryAction && isCanonicalPathFresh" ref="containerRef" class="share-actions-floating">
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
            <q-item-label class="share-menu-title">Share...</q-item-label>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { copyToClipboard } from 'quasar'
import { notifyInfo } from 'src/utils/notify.js'
import {
  isCanonicalPathCompatibleWithRouteTarget,
  toChannelRouteTargetFromContext
} from '@utils/channel-route.js'

const props = defineProps({
  channel: { type: Object, required: true },
  album: { type: Object, default: null },
  media: { type: Object, default: null },
  routeContext: { type: Object, required: true }
})

const showAdvanced = ref(false)
const menuOpen = ref(false)
const containerRef = ref(null)
const route = useRoute()

const routeType = computed(() => props.routeContext.type)

const activeCanonicalPath = computed(() => {
  if (routeType.value === 'channel') {
    return props.channel?.canonicalPath?.publicPath || null
  }

  if (routeType.value === 'album') {
    return props.album?.canonicalPath?.publicPath || null
  }

  if (routeType.value === 'privateAlbum') {
    return props.album?.canonicalPath?.privatePath || null
  }

  if (routeType.value === 'media') {
    return props.media?.canonicalPath?.publicPath || null
  }

  if (routeType.value === 'privateAlbumMedia') {
    return props.media?.canonicalPath?.privateAlbumPath || null
  }

  if (routeType.value === 'privateMedia') {
    return props.media?.canonicalPath?.privatePath || null
  }

  return null
})

const isCanonicalPathFresh = computed(() => {
  const target = toChannelRouteTargetFromContext(props.routeContext)
  const canonicalPath = activeCanonicalPath.value
  return isCanonicalPathCompatibleWithRouteTarget(canonicalPath, target)
})

const shareActionTemplates = {
  channel: {
    key: 'share-channel',
    label: 'Entire channel',
    description: 'Recipient can browse everything in this channel.',
    icon: 'apps',
    cy: 'share-channel'
  },
  albumOnly: {
    key: 'share-album-private',
    label: 'This album',
    description: 'Recipient can browse videos from this album only.',
    icon: 'folder',
    cy: 'share-only-album'
  },
  albumWithinChannel: {
    key: 'share-album-channel',
    label: 'Entire channel',
    description: 'Recipient can browse everything in this channel.',
    icon: 'apps',
    cy: 'share-within-channel'
  },
  mediaOnly: {
    key: 'share-media-only',
    label: 'Only this video',
    description: 'Recipient can watch this video only.',
    icon: 'movie',
    cy: 'share-only-video'
  },
  mediaWithinAlbum: {
    key: 'share-media-album',
    label: 'This album',
    description: 'Recipient can browse related videos in this album.',
    icon: 'folder',
    cy: 'share-within-album'
  },
  mediaWithinChannel: {
    key: 'share-media-channel',
    label: 'Entire channel',
    description: 'Recipient can browse everything in this channel.',
    icon: 'apps',
    cy: 'share-within-channel'
  }
}

const channelMenuActions = computed(() => {
  return [{ ...shareActionTemplates.channel, path: props.channel.canonicalPath.publicPath }]
})

const albumMenuActions = computed(() => {
  const albumPublicPath = props.album.canonicalPath.publicPath
  const albumPrivatePath = props.album.canonicalPath.privatePath

  if (routeType.value === 'privateAlbum') {
    return [{ ...shareActionTemplates.albumOnly, path: albumPrivatePath }]
  }

  if (routeType.value === 'album') {
    return [
      { ...shareActionTemplates.albumOnly, path: albumPrivatePath },
      { ...shareActionTemplates.albumWithinChannel, path: albumPublicPath }
    ]
  }

  return []
})

const mediaMenuActions = computed(() => {
  const mediaPublicPath = props.media.canonicalPath.publicPath
  const mediaPrivatePath = props.media.canonicalPath.privatePath
  const mediaPrivateAlbumPath = props.media.canonicalPath.privateAlbumPath

  if (routeType.value === 'privateMedia') {
    return [{ ...shareActionTemplates.mediaOnly, path: mediaPrivatePath }]
  }

  if (routeType.value === 'privateAlbumMedia') {
    return [
      { ...shareActionTemplates.mediaOnly, path: mediaPrivatePath },
      { ...shareActionTemplates.mediaWithinAlbum, path: mediaPrivateAlbumPath }
    ]
  }

  if (routeType.value === 'media') {
    return [
      { ...shareActionTemplates.mediaOnly, path: mediaPrivatePath },
      { ...shareActionTemplates.mediaWithinAlbum, path: mediaPrivateAlbumPath },
      { ...shareActionTemplates.mediaWithinChannel, path: mediaPublicPath }
    ]
  }
  return []
})

const menuActions = computed(() => {
  if (routeType.value === 'channel') {
    return channelMenuActions.value
  }
  if (routeType.value === 'album' || routeType.value === 'privateAlbum') {
    return albumMenuActions.value
  }
  if (
    routeType.value === 'media' ||
    routeType.value === 'privateAlbumMedia' ||
    routeType.value === 'privateMedia'
  ) {
    return mediaMenuActions.value
  }
  throw new Error(`Unsupported route context type for share actions: ${routeType.value}`)
})

const primaryAction = computed(() => {
  if (!menuActions.value.length) return null
  return menuActions.value[0]
})

const advancedActions = computed(() => {
  if (menuActions.value.length <= 1) return []
  return menuActions.value.slice(1)
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

watch(
  () => route.path,
  () => {
    closeMenu()
  }
)

function copyLink(path) {
  const absolutePath = `${globalThis.location.origin}${path}`
  const clipboard = globalThis.navigator?.clipboard
  const copyPromise = clipboard?.writeText
    ? clipboard.writeText(absolutePath)
    : copyToClipboard(absolutePath)

  copyPromise.then(() => {
    notifyInfo('Link copied to clipboard.', {
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
