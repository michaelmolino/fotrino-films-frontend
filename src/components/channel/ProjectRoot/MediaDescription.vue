<template>
  <q-card flat bordered class="description">
    <q-card-section vertical>
      <q-icon :name="isPublic ? 'public' : 'public_off'" size="md" class="q-pr-sm" />
      <span class="text-h6">{{ media?.title || '' }}</span>
      <q-btn
        flat
        class="q-pa-sm float-right"
        icon="flag"
        color="warning"
        data-cy="report-button"
        @click="openReportDialog" />
      <q-btn-dropdown
        dropdown-icon="fas fa-share-nodes"
        class="q-pa-sm float-right"
        color="info"
        data-cy="share-button"
        flat>
        <q-list>
          <q-item v-if="isPublic" clickable v-close-popup @click="copyLink('public')">
            <q-item-section avatar>
              <q-avatar icon="public" color="accent" text-color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Share within this channel</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="far fa-copy" color="accent" />
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="copyLink('private')">
            <q-item-section avatar>
              <q-avatar icon="public_off" color="accent" text-color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label v-if="isPublic">Share only this video</q-item-label>
              <q-item-label v-else>Share this video</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="far fa-copy" color="accent" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <div class="text-subtitle2 q-pl-xl">Captured {{ sinceCaptured }}</div>
      <div class="text-subtitle2 q-pl-xl">Published {{ sincePublished }}</div>
    </q-card-section>
    <q-separator inset v-if="descriptionSafe" />
    <q-card-section vertical>
      <div class="text-body1" v-html="descriptionSafe"></div>
    </q-card-section>

    <q-dialog v-model="reportDialog" persistent>
      <q-card style="min-width: 320px; max-width: 480px">
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
            placeholder="Reason (optional)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" :disable="submitting" v-close-popup />
          <q-btn unelevated label="Submit" color="negative" :loading="submitting" @click="submitReport" />
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
import { useStore } from 'vuex'

const props = defineProps({
  media: Object
})

const route = useRoute()
const isPublic = computed(() => !!route.params.uuid)
const sinceCaptured = computed(() =>
  props.media?.resource_date ? daysSince(props.media.resource_date, false) : ''
)
const sincePublished = computed(() => (props.media?.created ? daysSince(props.media.created) : ''))
const descriptionSafe = computed(() => sanitizeHtml(props.media?.description_unsafe || ''))

const reportDialog = ref(false)
const reason = ref('')
const submitting = ref(false)
const store = useStore()

function openReportDialog() {
  if (!props.media?.private_id) return
  reportDialog.value = true
}

async function submitReport() {
  if (!props.media?.private_id) return
  submitting.value = true
  try {
    const res = await store.dispatch('channel/reportMedia', {
      privateId: props.media.private_id,
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
    // Errors are handled by interceptor; just keep dialog open for user to retry/cancel
  } finally {
    submitting.value = false
  }
}

function copyLink(val) {
  if (val === 'public') {
    copyToClipboard(window.location.href).then(() => {
      Notify.create({
        message: 'URL copied to clipboard',
        color: 'accent',
        icon: 'far fa-clipboard',
        timeout: 1000
      })
    })
  } else if (val === 'private') {
    const id = props.media?.private_id
    if (!id) return
    copyToClipboard(`${window.location.origin}/private/${id}`).then(() => {
      Notify.create({
        message: 'URL copied to clipboard',
        color: 'accent',
        icon: 'far fa-clipboard',
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
</style>
