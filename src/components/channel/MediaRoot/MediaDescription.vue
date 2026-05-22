<template>
  <q-card flat bordered class="description" data-cy="media-description-card">
    <q-card-section vertical>
      <div class="description-header">
        <div class="description-title-wrap">
          <div class="description-mini-poster" :style="miniPosterStyle" aria-hidden="true">
            <q-img
              v-if="miniPosterSrc"
              :src="miniPosterSrc"
              class="description-mini-poster-image"
              fit="cover"
              loading="lazy"
              decoding="async" />
          </div>
          <div class="description-text-wrap">
            <span class="text-h6 description-title">{{ media?.title || '' }}</span>
            <div class="description-meta text-subtitle2">Captured {{ sinceCaptured }}</div>
            <div class="description-meta text-subtitle2">Published {{ sincePublished }}</div>
          </div>
        </div>
        <div class="description-actions">
          <q-btn
            v-if="$q.platform.is.desktop"
            flat
            class="q-pa-sm"
            icon="keyboard"
            color="primary"
            aria-label="Show keyboard shortcuts"
            data-cy="keyboard-shortcuts-button"
            @click="openShortcutsDialog">
            <q-tooltip>Keyboard Shortcuts</q-tooltip>
          </q-btn>
          <q-btn
            flat
            class="q-pa-sm"
            icon="flag"
            color="warning"
            aria-label="Report this content"
            data-cy="report-button"
            @click="openReportDialog">
            <q-tooltip>Report</q-tooltip>
          </q-btn>
        </div>
      </div>
    </q-card-section>
    <q-separator inset v-if="descriptionSafe" />
    <q-card-section vertical>
      <div class="text-body1" data-cy="media-description-text" v-html="descriptionSafe"></div>
    </q-card-section>

    <q-dialog v-model="reportDialog" persistent data-cy="report-dialog">
      <q-card style="min-width: 320px; max-width: 480px" data-cy="report-dialog-card">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="flag" color="negative" />
          <div class="text-h6">Report this video</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body2 q-mb-sm">Tell us what's wrong (optional):</div>
          <q-input
            v-model="reason"
            type="textarea"
            autogrow
            outlined
            counter
            :maxlength="500"
            data-cy="report-reason-input"
            placeholder="Reason (optional)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" :disable="submitting" v-close-popup />
          <q-btn
            unelevated
            label="Submit"
            color="negative"
            :loading="submitting"
            data-cy="report-submit"
            @click="submitReport" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="shortcutsDialog" data-cy="keyboard-shortcuts-dialog">
      <q-card class="shortcuts-card" data-cy="keyboard-shortcuts-card">
        <q-card-section class="row items-center q-gutter-sm q-pb-sm">
          <q-icon name="keyboard" color="primary" />
          <div class="text-h6">Keyboard Shortcuts</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-markup-table dense flat bordered class="shortcuts-table">
            <thead>
              <tr>
                <th scope="col" class="text-left">Key</th>
                <th scope="col" class="text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shortcut in keyboardShortcuts" :key="shortcut.keys">
                <td class="shortcut-keys">{{ shortcut.keys }}</td>
                <td>{{ shortcut.action }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notify, useQuasar } from 'quasar'
import { sanitizeHtml } from '@utils/text.js'
import { daysSince } from '@utils/date.js'
import { useChannelStore } from 'src/stores/channel-store.js'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'

const props = defineProps({
  media: Object,
  poster: {
    type: String,
    default: null
  },
  posterColor: {
    type: String,
    default: null
  }
})

const $q = useQuasar()
const sinceCaptured = computed(() =>
  props.media?.resourceDate ? daysSince(props.media.resourceDate, false) : ''
)
const sincePublished = computed(() => (props.media?.created ? daysSince(props.media.created) : ''))
const descriptionSafe = computed(() => sanitizeHtml(props.media?.descriptionUnsafe || ''))
const miniPosterSrc = computed(() => props.poster || null)
const miniPosterStyle = computed(() => ({
  backgroundColor: props.posterColor || '#1f2933'
}))

const reportDialog = ref(false)
const shortcutsDialog = ref(false)
const reason = ref('')
const submitting = ref(false)
const channelStore = useChannelStore()

const keyboardShortcuts = [
  { keys: 'Space', action: 'Toggle playback' },
  { keys: '←', action: 'Seek backward 10 seconds' },
  { keys: '→', action: 'Seek forward 10 seconds' },
  { keys: '↑', action: 'Increase volume' },
  { keys: '↓', action: 'Decrease volume' },
  { keys: 'M', action: 'Toggle mute' },
  { keys: 'F', action: 'Toggle fullscreen' },
  { keys: '0-9', action: 'Seek to 0-90% of the media' }
]

function openReportDialog() {
  if (!props.media?.privateId) return
  reportDialog.value = true
}

function openShortcutsDialog() {
  shortcutsDialog.value = true
}

async function submitReport() {
  if (!props.media?.privateId) return
  submitting.value = true
  try {
    const res = await channelStore.reportMedia({
      privateId: props.media.privateId,
      reason: reason.value
    })
    const reported = !!res?.reported
    if (reported) {
      Notify.create({
        message: 'Thanks for your report. Our team will review it.',
        color: 'positive',
        icon: 'check',
        timeout: 2000
      })
    } else {
      const msg = res?.message || 'This video has already been reported by you.'
      Notify.create({ message: msg, color: 'info', icon: 'info', timeout: 2000 })
    }
    reportDialog.value = false
    reason.value = ''
  } catch (e) {
    console.debug(e)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(e, 'Unable to submit report right now.'),
      icon: 'warning',
      timeout: 3000
    })
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.description {
  width: 100%;
  max-width: 720px;
  min-width: 240px;
}

.description-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.description-title-wrap {
  display: flex;
  align-items: stretch;
  min-width: 0;
  flex: 1 1 320px;
  gap: 10px;
}

.description-mini-poster {
  position: relative;
  overflow: hidden;
  flex: 0 0 auto;
  width: 56px;
  min-width: 56px;
  height: 84px;
  border-radius: 8px;
}

.description-mini-poster-image {
  width: 100%;
  height: 100%;
}

.description-title {
  min-width: 0;
  line-height: 1.25;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.description-text-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
}

.description-meta {
  line-height: 1.2;
}

.description-actions {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex: 0 0 auto;
  margin-left: auto;
}

.shortcuts-card {
  min-width: 280px;
  width: 100%;
  max-width: 360px;
}

.shortcuts-table {
  width: 100%;
}

.shortcut-keys {
  white-space: nowrap;
  font-weight: 600;
}

@media (max-width: 600px) {
  .description-header {
    flex-wrap: nowrap;
  }

  .description-title-wrap {
    min-width: 0;
    flex: 1 1 auto;
  }

  .description-actions {
    margin-left: 0;
    flex-shrink: 0;
  }

  .description-title {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .description-mini-poster {
    width: 48px;
    min-width: 48px;
    height: 72px;
  }
}
</style>
