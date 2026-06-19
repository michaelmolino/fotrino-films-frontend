<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 q-mb-sm row items-center no-wrap q-gutter-xs">
        <q-icon name="cloud_upload" size="18px" color="grey-8" />
        <span>Upload Summary</span>
      </div>
      <MediaPreview :media="media" :album="album" :detail="isCompletePhase" />
      <div class="summary-description-box q-mt-sm">
        <div class="text-caption text-grey-7 q-mb-xs">Description</div>
        <div
          v-if="hasSummaryDescription"
          class="summary-description-text"
          v-html="summaryDescriptionHtml"></div>
      </div>
      <q-list dense class="q-mt-md">
        <q-item>
          <q-item-section avatar class="summary-resource-avatar">
            <q-avatar v-if="isVideoSummaryReady" size="26px" class="summary-step-avatar">
              <q-img
                v-if="videoSummaryPreviewSrc"
                :src="videoSummaryPreviewSrc"
                fit="cover"
                loading="lazy"
                decoding="async" />
              <q-icon v-else name="movie" size="14px" :color="iconColorOnSurface" />
            </q-avatar>
            <span v-else class="summary-step-dot text-grey-6" aria-hidden="true" />
          </q-item-section>
          <q-item-section class="summary-item-section">
            <q-item-label class="summary-item-label">{{ videoSummaryLabel }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              v-if="videoCompletionSource === 'auto'"
              outline
              :color="badgeColorDefaulted"
              label="Defaulted" />
            <q-badge
              v-else-if="videoCompletionSource === 'user'"
              outline
              :color="badgeColorCustom"
              label="Custom" />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar class="summary-resource-avatar">
            <q-avatar v-if="isChannelSummaryReady" size="26px" class="summary-step-avatar">
              <q-img
                v-if="channelSummaryAvatarSrc"
                :src="channelSummaryAvatarSrc"
                fit="cover"
                loading="lazy"
                decoding="async" />
              <q-icon v-else name="apps" size="14px" :color="iconColorOnSurface" />
            </q-avatar>
            <span v-else class="summary-step-dot text-grey-6" aria-hidden="true" />
          </q-item-section>
          <q-item-section class="summary-item-section">
            <q-item-label class="summary-item-label">{{ channelSummaryLabel }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              v-if="channelCompletionSource === 'auto'"
              outline
              :color="badgeColorDefaulted"
              label="Defaulted" />
            <q-badge
              v-else-if="channelCompletionSource === 'user'"
              outline
              :color="badgeColorCustom"
              label="Custom" />
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar top class="summary-resource-avatar summary-avatar-top">
            <q-avatar
              v-if="isAlbumSummaryReady && albumCompletionSource"
              size="26px"
              class="summary-step-avatar"
              :class="albumSummaryAvatarClass"
              :style="albumSummaryAvatarStyle">
              <q-img
                v-if="albumSummaryPosterSrc"
                :src="albumSummaryPosterSrc"
                fit="cover"
                loading="lazy"
                decoding="async" />
            </q-avatar>
            <span v-else class="summary-step-dot text-grey-6" aria-hidden="true" />
          </q-item-section>
          <q-item-section class="summary-item-section">
            <q-item-label class="summary-item-label">{{ albumSummaryLabel }}</q-item-label>
            <q-item-label v-if="showAlbumSubtitle" caption class="summary-item-subtitle">
              {{ albumSummarySubtitle }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge
              v-if="albumCompletionSource === 'auto'"
              outline
              :color="badgeColorDefaulted"
              label="Defaulted" />
            <q-badge
              v-else-if="albumCompletionSource === 'user'"
              outline
              :color="badgeColorCustom"
              label="Custom" />
          </q-item-section>
        </q-item>
      </q-list>
      <div class="summary-captured text-caption text-grey-7 q-mt-sm">
        {{ capturedSummaryLabel }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'
import MediaPreview from '@components/channel/shared/MediaPreview.vue'

const props = defineProps({
  media: { type: Object, required: true },
  album: { type: Object, required: true },
  uploadPhase: { type: String, required: true },
  hasSummaryDescription: { type: Boolean, required: true },
  summaryDescriptionHtml: { type: String, required: true },
  isVideoSummaryReady: { type: Boolean, required: true },
  iconColorOnSurface: { type: String, required: true },
  videoCompletionSource: { type: String, default: null },
  isChannelSummaryReady: { type: Boolean, required: true },
  channelSummaryAvatarSrc: { type: String, default: null },
  channelSummaryLabel: { type: String, required: true },
  channelCompletionSource: { type: String, default: null },
  isAlbumSummaryReady: { type: Boolean, required: true },
  albumSummaryPosterSrc: { type: String, default: null },
  albumSummaryPosterColor: { type: String, default: null },
  albumSummaryLabel: { type: String, required: true },
  albumSummarySubtitle: { type: String, default: '' },
  albumCompletionSource: { type: String, default: null },
  badgeColorDefaulted: { type: String, required: true },
  badgeColorCustom: { type: String, required: true },
  capturedSummaryLabel: { type: String, required: true }
})

const isCompletePhase = computed(() => props.uploadPhase === 'complete')
const videoSummaryLabel = computed(() => {
  const title = props.media?.title
  return typeof title === 'string' && title.trim().length > 0 ? title.trim() : 'Video'
})
const videoSummaryPreviewSrc = computed(
  () => resolveImagePrimaryUrl(props.media?.previewAsset) || null
)
const showAlbumSubtitle = computed(() => !!props.albumSummarySubtitle)
const albumSummaryAvatarClass = computed(() => ({
  'summary-step-swatch': !props.albumSummaryPosterSrc
}))
const albumSummaryAvatarStyle = computed(() => {
  if (props.albumSummaryPosterSrc || !props.albumSummaryPosterColor) {
    return undefined
  }
  return { backgroundColor: props.albumSummaryPosterColor }
})
</script>

<style scoped>
.summary-item-section {
  min-width: 0;
}

.summary-item-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-step-dot {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 2px dashed currentColor;
  box-sizing: border-box;
}

.summary-description-box {
  border: 1px solid rgba(98, 112, 127, 0.35);
  border-radius: 6px;
  padding: 8px 10px;
}

.summary-description-text {
  margin: 0;
  line-height: 1.35;
  line-clamp: 3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary-description-text :deep(p) {
  margin: 0;
}

.summary-step-avatar {
  overflow: hidden;
  border-radius: 50% !important;
}

.summary-step-swatch {
  border: 1px solid #000000;
  box-sizing: border-box;
}

.summary-resource-avatar {
  align-items: center;
}

.summary-avatar-top {
  padding-top: 2px;
}

.summary-item-subtitle {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.65;
}

.summary-captured {
  border-top: 1px solid var(--q-grey-3);
  padding-top: 8px;
}
</style>
