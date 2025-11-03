<template>
  <q-btn
    flat
    dense
    no-caps
    padding="8px"
    data-cy="media-preview"
    :to="to"
    :aria-label="`View ${media.title}`"
    :class="['fit', 'width720', { 'bg-accent': media.main && showMainAccent }]">
    <q-badge
      v-if="media.type?.startsWith('audio/')"
      class="bg-accent q-pa-md z-top"
      floating
      transparent>
      <span class="text-bold">Audio</span>
    </q-badge>
     <q-img
      v-if="media.preview"
      :src="webpUrl ? webpUrl : media.preview"
      :alt="media.title"
      :ratio="16 / 9"
      fit="cover"
      :loading="priority === 'high' ? 'eager' : 'lazy'"
      decoding="async"
      @load="onPreviewLoad">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">
          <span>{{ media.title }}</span
          ><span v-if="detail && media.title !== project?.title"><br />{{ project?.title }}</span>
        </div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis">
            <span>{{ media.title }}</span
            ><span v-if="detail && media.title !== project?.title"><br />{{ project?.title }}</span>
          </div>
        </div>
      </template>
    </q-img>
    <q-skeleton
      v-if="!media.preview"
      class="cursor-not-allowed preview-skeleton"
      animation="none" />
  </q-btn>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { addPreconnectForUrl } from '@utils/preconnect'
import { useWebP } from '@composables/useWebP'

const { media, project, detail, showMainAccent, priority, to } = defineProps({
  media: Object,
  project: Object,
  detail: Boolean,
  showMainAccent: { type: Boolean, default: true },
  priority: { type: String, default: 'auto' }, // 'high', 'low', or 'auto'
  to: String
})

const { checkWebPVersion } = useWebP()
const webpUrl = ref(null)
const imageError = ref(false)

onMounted(async () => {
  if (media?.preview) {
    const url = await checkWebPVersion(media.preview)
    // Only set webpUrl if it's different from the original (meaning WebP exists)
    if (url !== media.preview && url.endsWith('.webp')) {
      webpUrl.value = url
    }
  }
})

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
