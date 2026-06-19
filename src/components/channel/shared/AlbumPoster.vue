<template>
  <q-btn
    flat
    dense
    no-caps
    class="fit"
    padding="16px"
    data-cy="album-poster"
    :to="to"
    :aria-label="`View album: ${album.title}`">
    <q-badge class="text-white bg-accent q-pa-md z-top" floating>
      <span class="text-bold">{{ album.media.length }}</span>
    </q-badge>
    <div v-if="showPosterSkeleton" class="poster-skeleton">
      <q-skeleton type="rect" class="fit" animation="none" />
    </div>
    <q-img
      v-else-if="posterUrl"
      :src="posterUrl"
      :ratio="2 / 3"
      fit="cover"
      loading="lazy"
      decoding="async">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ album.title }}</div>
        <div class="ellipsis">{{ album.subtitle }}</div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis">{{ album.title }}</div>
          <div class="ellipsis">{{ album.subtitle }}</div>
        </div>
      </template>
    </q-img>
    <div
      v-else
      class="poster-fallback"
      :style="{ backgroundColor: album.posterColor || '#000000' }">
      <!-- Centered overlay in the main body for color fallback -->
      <div
        class="absolute-center text-center q-pa-sm poster-center-overlay"
        :style="contrastTextStyle">
        <div class="ellipsis text-weight-bold">{{ album.title }}</div>
        <div class="ellipsis">{{ album.subtitle }}</div>
      </div>
    </div>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

const props = defineProps({
  album: Object,
  to: [String, Object]
})

const posterUrl = computed(() => resolveImagePrimaryUrl(props.album?.posterAsset))
const hasPosterAsset = computed(
  () => Array.isArray(props.album?.posterAsset) && props.album.posterAsset.some(asset => !!asset?.key)
)
const showPosterSkeleton = computed(
  () => props.album?.posterType === 'new' && !posterUrl.value && !hasPosterAsset.value
)

function hexToRgb(hex) {
  let h = (hex || '').trim()
  if (h.startsWith('#')) h = h.slice(1)
  if (h.length === 3) {
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  }
  const int = Number.parseInt(h || '000000', 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return { r, g, b }
}

function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex || '#000000')
  // YIQ formula for perceived brightness; choose black for light bg, white for dark bg
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#FFFFFF'
}

const contrastTextColor = computed(() => getContrastColor(props.album?.posterColor || '#000000'))
const contrastTextStyle = computed(() => ({ color: contrastTextColor.value }))
</script>

<style scoped>
.poster-fallback {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3; /* match q-img ratio for consistency */
}

.poster-skeleton {
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 4px;
}

.poster-center-overlay {
  pointer-events: none; /* allow click-through to the button */
}
</style>
