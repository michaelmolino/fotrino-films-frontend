<template>
  <component
    :is="interactive ? QBtn : 'div'"
    v-bind="interactive ? { flat: true, dense: true, noCaps: true, padding: '8px', to } : {}"
    data-cy="media-preview"
    :aria-label="`View ${media.title}`"
    :class="containerClasses">
    <q-badge
      v-if="showBadges && media.type?.startsWith('audio/')"
      class="bg-accent q-pa-md z-top"
      floating>
      <span class="text-bold text-white">Audio</span>
    </q-badge>
    <q-badge
      v-if="showBadges && media.orientation === 'portrait' && !media.type?.startsWith('audio/')"
      class="bg-info text-white q-pa-sm z-top"
      floating>
      <q-icon name="smartphone" size="16px" />
    </q-badge>
    <q-img
      v-if="media.preview && ready"
      :src="finalUrl"
      :alt="media.title"
      :ratio="16 / 9"
      fit="cover"
      :position="previewCropPosition"
      :loading="priority === 'high' ? 'eager' : 'lazy'"
      decoding="async"
      @load="onPreviewLoad"
      @error="onPreviewError">
      <div v-if="showTitleOverlay" class="absolute-bottom text-center">
        <div class="ellipsis">
          <span>{{ media.title }}</span
          ><span v-if="detail && media.title !== album?.title"><br />{{ album?.title }}</span>
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
            <span>{{ media.title }}</span
            ><span v-if="detail && media.title !== album?.title"><br />{{ album?.title }}</span>
          </div>
        </div>
      </template>
    </q-img>
    <q-skeleton
      v-if="media.preview && !ready"
      class="cursor-not-allowed preview-skeleton"
      animation="wave" />
    <q-skeleton
      v-if="!media.preview"
      class="cursor-not-allowed preview-skeleton"
      animation="none" />
  </component>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { QBtn } from 'quasar'
import { addPreconnectForUrl } from '@utils/preconnect'
import { useWebP } from '@composables/useWebP'

const previewCropPosition = '50% 28%'

const { media, album, detail, showMainAccent, showBadges, showTitleOverlay, interactive, priority, to } = defineProps({
  media: { type: Object, required: true },
  album: { type: Object, default: null },
  detail: { type: Boolean, default: false },
  showMainAccent: { type: Boolean, default: true },
  showBadges: { type: Boolean, default: true },
  showTitleOverlay: { type: Boolean, default: true },
  interactive: { type: Boolean, default: true },
  priority: { type: String, default: 'auto' }, // 'high', 'low', or 'auto'
  to: { type: [String, Object], default: null }
})

const containerClasses = computed(() => [interactive ? 'fit width720' : 'full-fit', { 'bg-accent': media.main && showMainAccent }])

const { resolvePreviewSource } = useWebP()
const previewSource = ref({ strategy: 'original-only', primaryUrl: null, fallbackUrl: null })
const finalUrl = ref(null)
const ready = ref(false)
let previewResolveToken = 0

// Watch media.preview to re-resolve whenever it changes (e.g., thumbnail refresh)
watch(
  () => media?.preview,
  async (newPreview, _oldPreview, onCleanup) => {
    const token = ++previewResolveToken
    let active = true
    onCleanup(() => {
      active = false
    })

    if (!newPreview) {
      previewSource.value = { strategy: 'original-only', primaryUrl: null, fallbackUrl: null }
      finalUrl.value = null
      ready.value = false
      return
    }
    // Reset ready to show skeleton while resolving
    ready.value = false
    // Resolve explicit source strategy: primary first, fallback on error.
    const resolved = await resolvePreviewSource(newPreview)
    if (!active || token !== previewResolveToken) return
    previewSource.value = resolved
    finalUrl.value = resolved.primaryUrl || newPreview
    ready.value = true
  },
  { immediate: true }
)

function onPreviewLoad() {
  if (finalUrl.value) addPreconnectForUrl(finalUrl.value)
}

function onPreviewError() {
  if (previewSource.value.fallbackUrl && finalUrl.value !== previewSource.value.fallbackUrl) {
    finalUrl.value = previewSource.value.fallbackUrl
  }
}
</script>

<style scoped>
.preview-skeleton {
  width: 250px;
  height: 141px;
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
