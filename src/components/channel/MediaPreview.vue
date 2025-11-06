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
      floating>
      <span class="text-bold">Audio</span>
    </q-badge>
     <q-img
      v-if="media.preview && ready"
      :src="finalUrl"
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
      v-if="media.preview && !ready"
      class="cursor-not-allowed preview-skeleton"
      animation="wave" />
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
const finalUrl = ref(null)
const ready = ref(false)

onMounted(async () => {
  if (!media?.preview) return
  // Resolve the final URL (WebP if supported & exists, else original) BEFORE rendering to avoid double fetch
  const resolved = await checkWebPVersion(media.preview)
  finalUrl.value = resolved || media.preview
  ready.value = true
})

function onPreviewLoad() {
  if (finalUrl.value) addPreconnectForUrl(finalUrl.value)
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
