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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { copyToClipboard } from 'quasar'
import { notifyInfo } from 'src/utils/notify.js'

const props = defineProps({
  channel: { type: Object, required: true },
  album: { type: Object, default: null },
  media: { type: Object, default: null },
  routeContext: { type: Object, default: null }
})

const showAdvanced = ref(false)
const menuOpen = ref(false)
const containerRef = ref(null)

const shareContext = computed(() => {
  if (props.media) return 'media'
  if (props.album) return 'album'
  return 'channel'
})

function getCanonicalPathValue(canonicalPath, key) {
  if (!canonicalPath) return null
  if (typeof canonicalPath === 'string') {
    return key === 'publicPath' ? canonicalPath : null
  }
  if (typeof canonicalPath === 'object') {
    return canonicalPath[key] || null
  }
  return null
}

const channelPublicPath = computed(() =>
  getCanonicalPathValue(props.channel?.canonicalPath, 'publicPath')
)

const albumPublicPath = computed(() =>
  getCanonicalPathValue(props.album?.canonicalPath, 'publicPath')
)

const albumPrivatePath = computed(() =>
  getCanonicalPathValue(props.album?.canonicalPath, 'privatePath')
)

const mediaPublicPath = computed(() =>
  getCanonicalPathValue(props.media?.canonicalPath, 'publicPath')
)

const mediaPrivatePath = computed(() =>
  getCanonicalPathValue(props.media?.canonicalPath, 'privatePath')
)

const mediaPrivateAlbumPath = computed(() =>
  getCanonicalPathValue(props.media?.canonicalPath, 'privateAlbumPath')
)

const isPrivateAlbumContext = computed(() => {
  return Boolean(
    props.routeContext?.type === 'privateAlbum' ||
    props.routeContext?.type === 'privateAlbumMedia' ||
    (!albumPublicPath.value && albumPrivatePath.value)
  )
})

function buildChannelActions() {
  if (!channelPublicPath.value) return []
  return [
    {
      key: 'share-channel',
      label: 'Entire channel',
      description: 'Recipient can browse everything in this channel.',
      icon: 'apps',
      path: channelPublicPath.value,
      cy: 'share-channel'
    }
  ]
}

function buildAlbumActions() {
  const items = []

  if (albumPrivatePath.value) {
    items.push({
      key: 'share-album-private',
      label: 'This album',
      description: 'Recipient can browse videos from this album only.',
      icon: 'folder',
      path: albumPrivatePath.value,
      cy: 'share-only-album'
    })
  } else if (albumPublicPath.value) {
    items.push({
      key: 'share-album-public',
      label: 'This album',
      description: 'Recipient can only browse videos from this album.',
      icon: 'folder',
      path: albumPublicPath.value,
      cy: 'share-only-album'
    })
  }

  if (isPrivateAlbumContext.value) {
    return items
  }

  if (channelPublicPath.value) {
    items.push({
      key: 'share-album-channel',
      label: 'Entire channel',
      description: 'Recipient can browse everything in this channel.',
      icon: 'apps',
      path: albumPublicPath.value || channelPublicPath.value,
      cy: 'share-within-channel'
    })
  }

  return items
}

function buildMediaActions() {
  const items = []

  if (mediaPrivatePath.value || mediaPrivateAlbumPath.value || mediaPublicPath.value) {
    items.push({
      key: 'share-media-only',
      label: 'Only this video',
      description: 'Recipient can watch this video only.',
      icon: 'movie',
      path: mediaPrivatePath.value || mediaPrivateAlbumPath.value || mediaPublicPath.value,
      cy: 'share-only-video'
    })
  }

  if (mediaPrivateAlbumPath.value) {
    items.push({
      key: 'share-media-album',
      label: 'This album',
      description: 'Recipient can browse related videos in this album.',
      icon: 'folder',
      path: mediaPrivateAlbumPath.value,
      cy: 'share-within-album'
    })
  }

  if (channelPublicPath.value && !isPrivateAlbumContext.value) {
    items.push({
      key: 'share-media-channel',
      label: 'Entire channel',
      description: 'Recipient can browse everything in this channel.',
      icon: 'apps',
      path: mediaPublicPath.value || channelPublicPath.value,
      cy: 'share-within-channel'
    })
  }
  return items
}

const menuActions = computed(() => {
  if (shareContext.value === 'media') return buildMediaActions()
  if (shareContext.value === 'album') return buildAlbumActions()
  return buildChannelActions()
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

function copyLink(path) {
  if (!path) return
  copyToClipboard(`${globalThis.location.origin}${path}`).then(() => {
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
