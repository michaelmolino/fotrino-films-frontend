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
    <q-img
      v-if="media.preview"
      :src="previewSrc"
      :ratio="16 / 9"
      fit="cover"
      loading="lazy"
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

const { media, project, detail, showMainAccent } = defineProps({
  media: Object,
  project: Object,
  detail: Boolean,
  showMainAccent: { type: Boolean, default: true }
})

const { checkWebPVersion } = useWebP()
const previewSrc = ref(media?.preview)

onMounted(async () => {
  if (media?.preview) {
    previewSrc.value = await checkWebPVersion(media.preview)
  }
})

function onPreviewLoad() {
  if (previewSrc.value) addPreconnectForUrl(previewSrc.value)
}
</script>

<style scoped>
.preview-skeleton {
  width: 250px;
  height: 141px;
}
</style>
