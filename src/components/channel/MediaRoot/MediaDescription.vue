<template>
  <q-card flat bordered class="description" data-cy="media-description-card">
    <q-card-section vertical>
      <div class="description-header">
        <div class="description-title-wrap">
          <q-icon :name="isPublic ? 'public' : 'public_off'" size="md" class="q-pr-sm description-visibility-icon" />
          <span class="text-h6 description-title">{{ media?.title || '' }}</span>
        </div>
        <div class="description-actions">
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
          <q-btn-dropdown
            dropdown-icon="share"
            class="q-pa-sm"
            color="info"
            aria-label="Share this video"
            data-cy="share-button"
            flat>
            <q-list>
              <q-item v-if="isPublic" clickable v-close-popup data-cy="share-within-channel" @click="copyLink('public')">
                <q-item-section avatar>
                  <q-avatar icon="public" color="accent" text-color="white" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Share within this channel</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="content_copy" color="accent" />
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup data-cy="share-only-video" @click="copyLink('private')">
                <q-item-section avatar>
                  <q-avatar icon="public_off" color="accent" text-color="white" />
                </q-item-section>
                <q-item-section>
                  <q-item-label v-if="isPublic">Share only this video</q-item-label>
                  <q-item-label v-else>Share this video</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="content_copy" color="accent" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
      <div class="text-subtitle2 q-pl-xl">Captured {{ sinceCaptured }}</div>
      <div class="text-subtitle2 q-pl-xl">Published {{ sincePublished }}</div>
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
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Notify, copyToClipboard } from 'quasar'
import { sanitizeHtml } from '@utils/text.js'
import { daysSince } from '@utils/date.js'
import { useChannelStore } from 'src/stores/channel-store.js'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'

const props = defineProps({
  media: Object
})

const route = useRoute()
const isPublic = computed(() => !!route.params.mediaId)
const sinceCaptured = computed(() =>
  props.media?.resourceDate ? daysSince(props.media.resourceDate, false) : ''
)
const sincePublished = computed(() => (props.media?.created ? daysSince(props.media.created) : ''))
const descriptionSafe = computed(() => sanitizeHtml(props.media?.descriptionUnsafe || ''))

const reportDialog = ref(false)
const reason = ref('')
const submitting = ref(false)
const channelStore = useChannelStore()

function openReportDialog() {
  if (!props.media?.privateId) return
  reportDialog.value = true
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

function copyLink(val) {
  if (val === 'public') {
    copyToClipboard(globalThis.location.href).then(() => {
      Notify.create({
        message: 'URL copied to clipboard',
        color: 'accent',
        icon: 'content_paste',
        timeout: 1000
      })
    })
  } else if (val === 'private') {
    const id = props.media?.uuid
    if (!id) return
    copyToClipboard(`${globalThis.location.origin}/private/m/${id}/${props.media?.slug || ''}`).then(() => {
      Notify.create({
        message: 'URL copied to clipboard',
        color: 'accent',
        icon: 'content_paste',
        timeout: 1000
      })
    })
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
  align-items: flex-start;
  min-width: 0;
  flex: 1 1 320px;
}

.description-visibility-icon {
  flex: 0 0 auto;
  margin-top: 2px;
}

.description-title {
  min-width: 0;
  line-height: 1.25;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.description-actions {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex: 0 0 auto;
  margin-left: auto;
}

@media (max-width: 600px) {
  .description-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
