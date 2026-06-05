<template>
  <component
    :is="rootTag"
    v-bind="rootBindings"
    data-cy="media-preview"
    :aria-label="mediaAriaLabel"
    :class="containerClasses">
    <q-badge v-if="showAudioBadge" class="bg-accent q-pa-md z-top" floating>
      <span class="text-bold text-white">Audio</span>
    </q-badge>
    <q-badge v-if="showPortraitBadge" class="bg-info text-white q-pa-sm z-top" floating>
      <q-icon name="smartphone" size="16px" />
    </q-badge>
    <q-img
      v-if="hasPreviewAsset && ready && finalUrl"
      :src="finalUrl"
      :alt="media.title"
      :ratio="16 / 9"
      fit="cover"
      :position="previewCropPosition"
      :loading="imageLoadingMode"
      decoding="async"
      @error="onPreviewError">
      <div v-if="showTitleOverlay" class="absolute-bottom text-center">
        <div class="ellipsis">
          <span>{{ titlePrimary }}</span
          ><span v-if="titleSecondary"><br />{{ titleSecondary }}</span>
        </div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div v-if="showTitleOverlay" class="absolute-bottom text-center">
          <div class="ellipsis">
            <span>{{ titlePrimary }}</span
            ><span v-if="titleSecondary"><br />{{ titleSecondary }}</span>
          </div>
        </div>
      </template>
    </q-img>
    <q-skeleton
      v-if="hasPreviewAsset && !ready"
      class="cursor-not-allowed preview-skeleton"
      animation="wave" />
    <q-skeleton
      v-if="!hasPreviewAsset || (hasPreviewAsset && ready && !finalUrl)"
      class="cursor-not-allowed preview-skeleton"
      animation="none" />
  </component>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { QBtn } from 'quasar'
import { useWebP } from '@composables/useWebP'

const previewCropPosition = '50% 28%'

const { media, album, detail, showBadges, showTitleOverlay, interactive, priority, to } =
  defineProps({
    media: { type: Object, required: true },
    album: { type: Object, default: null },
    detail: { type: Boolean, default: false },
    showBadges: { type: Boolean, default: true },
    showTitleOverlay: { type: Boolean, default: true },
    interactive: { type: Boolean, default: true },
    priority: { type: String, default: 'auto' }, // 'high', 'low', or 'auto'
    to: { type: [String, Object], default: null }
  })

const containerClasses = computed(() => [
  interactive ? 'fit width720' : 'full-fit',
  { 'bg-accent': media.main }
])

const rootTag = computed(() => (interactive ? QBtn : 'div'))
const rootBindings = computed(() =>
  interactive ? { flat: true, dense: true, noCaps: true, padding: '8px', to } : {}
)

const mediaAriaLabel = computed(() => `View ${media.title}`)
const isAudio = computed(() => media.type?.startsWith('audio/') ?? false)
const showAudioBadge = computed(() => showBadges && isAudio.value)
const showPortraitBadge = computed(
  () => showBadges && media.orientation === 'portrait' && !isAudio.value
)
const imageLoadingMode = computed(() => (priority === 'high' ? 'eager' : 'lazy'))
const titlePrimary = computed(() => media.title)
const titleSecondary = computed(() => {
  if (!detail || media.title === album?.title) return null
  return album.title
})
const hasPreviewAsset = computed(
  () => Array.isArray(media.previewAsset) && media.previewAsset.length > 0
)

const { resolvePreviewSource } = useWebP()
const finalUrl = ref(null)
const ready = ref(false)
let previewResolveToken = 0

// Watch media.preview to re-resolve whenever it changes (e.g., thumbnail refresh)
watch(
  () => media.previewAsset,
  async (newPreview, _oldPreview, onCleanup) => {
    const token = ++previewResolveToken
    let active = true
    onCleanup(() => {
      active = false
    })

    if (!newPreview) {
      finalUrl.value = null
      ready.value = false
      return
    }
    // Reset ready to show skeleton while resolving
    ready.value = false
    const resolved = await resolvePreviewSource(newPreview)
    if (!active || token !== previewResolveToken) return
    finalUrl.value = resolved?.url
    ready.value = true
  },
  { immediate: true }
)

function onPreviewError() {
  finalUrl.value = null
}
</script>

<style scoped>
.preview-skeleton {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.error-content {
  text-align: center;
}
.media-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 8px;
  z-index: 2;
}
</style>
