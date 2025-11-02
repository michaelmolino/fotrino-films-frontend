<template>
  <q-btn
    flat
    dense
    no-caps
    padding="8px"
    data-cy="media-preview"
    :class="['fit', 'width720', { 'bg-accent': media.main && showMainAccent }]">
    <q-badge
      v-if="media.type?.startsWith('audio/')"
      class="bg-accent q-pa-md z-top"
      floating
      transparent>
      <span class="text-bold">Audio</span>
    </q-badge>
    <div v-if="media.preview" class="media-preview-wrapper">
      <picture class="media-preview-img">
        <source v-if="webpUrl" :srcset="webpUrl" type="image/webp" />
        <img
          :src="media.preview"
          :alt="media.title"
          :loading="priority === 'high' ? 'eager' : 'lazy'"
          :fetchpriority="priority"
          decoding="async"
          @load="onPreviewLoad"
          @error="imageError = true"
          class="media-img" />
      </picture>
      <div v-if="imageError" class="image-error">
        <div class="error-content">
          <q-spinner-gears color="accent" size="xl" />
        </div>
      </div>
      <div class="absolute-bottom text-center media-title">
        <div class="ellipsis">
          <span>{{ media.title }}</span
          ><span v-if="detail && media.title !== project?.title"
            ><br />{{ project?.title }}</span
          >
        </div>
      </div>
    </div>
    <q-skeleton
      v-if="!media.preview"
      class="cursor-not-allowed preview-skeleton"
      animation="none" />
  </q-btn>
</template>

<script setup>
import { computed, ref } from 'vue'
import { addPreconnectForUrl } from '@utils/preconnect'
import { useWebP } from '@composables/useWebP'

const { media, project, detail, showMainAccent, priority } = defineProps({
  media: Object,
  project: Object,
  detail: Boolean,
  showMainAccent: { type: Boolean, default: true },
  priority: { type: String, default: 'auto' } // 'high', 'low', or 'auto'
})

const { getWebPUrl } = useWebP()
const webpUrl = computed(() => getWebPUrl(media?.preview))
const imageError = ref(false)

function onPreviewLoad() {
  if (media?.preview) addPreconnectForUrl(media.preview)
  imageError.value = false
}
</script>

<style scoped>
.preview-skeleton {
  width: 250px;
  height: 141px;
}
.media-preview-wrapper {
  width: 100%;
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: #000;
}
.media-preview-img {
  display: block;
  width: 100%;
  height: 100%;
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
