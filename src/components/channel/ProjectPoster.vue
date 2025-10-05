<template>
  <q-btn flat dense no-caps class="fit" padding="16px" data-cy="project-poster" :to="to">
    <q-badge class="bg-accent q-pa-md z-top" floating transparent>
      <span class="text-bold">{{ project.media.length }}</span>
    </q-badge>
    <q-img v-if="project.poster" :src="project.poster" :ratio="2 / 3" fit="cover">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ project.title }}</div>
        <div class="ellipsis">{{ project.subtitle }}</div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis">{{ project.title }}</div>
          <div class="ellipsis">{{ project.subtitle }}</div>
        </div>
      </template>
    </q-img>
    <div
      v-if="!project.poster"
      class="poster-fallback"
      :style="{ backgroundColor: project.poster_color || '#000000' }">
      <!-- Centered overlay in the main body for color fallback -->
      <div
        class="absolute-center text-center q-pa-sm poster-center-overlay"
        :style="{ color: contrastTextColor }">
        <div class="ellipsis text-weight-bold">{{ project.title }}</div>
        <div class="ellipsis">{{ project.subtitle }}</div>
      </div>
    </div>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: Object,
  to: [String, Object]
})

function hexToRgb(hex) {
  let h = (hex || '').trim()
  if (h.startsWith('#')) h = h.slice(1)
  if (h.length === 3) {
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  }
  const int = parseInt(h || '000000', 16)
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

const contrastTextColor = computed(() => getContrastColor(props.project?.poster_color || '#000000'))
</script>

<style scoped>
.poster-fallback {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3; /* match q-img ratio for consistency */
}
.poster-center-overlay {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  pointer-events: none; /* allow click-through to the button */
}
</style>
