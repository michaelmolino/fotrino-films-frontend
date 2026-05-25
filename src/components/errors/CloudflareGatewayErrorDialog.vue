<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="cf-error-card" data-cy="cloudflare-error-dialog">
      <q-card-section class="row items-center q-gutter-sm cf-error-header">
        <div class="cf-logo" aria-label="Cloudflare">
          <q-icon name="cloud" size="20px" />
          <span>Cloudflare</span>
        </div>
        <q-chip square color="orange-8" text-color="white" icon="warning">Gateway Error</q-chip>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-h6 q-mb-xs">{{ titleText }}</div>
        <div class="text-body1 q-mb-md">{{ whatYouShouldDo }}</div>

        <q-markup-table
          dense
          flat
          bordered
          class="cf-error-table"
          data-cy="cloudflare-error-details">
          <tbody>
            <tr v-for="item in detailRows" :key="item.label">
              <th scope="row" class="text-left">{{ item.label }}</th>
              <td class="text-left">{{ item.value }}</td>
            </tr>
          </tbody>
        </q-markup-table>

        <q-expansion-item
          class="q-mt-md"
          dense
          dense-toggle
          icon="code"
          label="Raw Cloudflare payload"
          data-cy="cloudflare-error-raw">
          <q-card flat bordered>
            <q-card-section>
              <pre class="cf-raw-json">{{ prettyPayload }}</pre>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="orange-9"
          :label="dismissLabel"
          @click="onDialogOK"
          data-cy="cloudflare-error-dismiss" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  payload: {
    type: Object,
    required: true
  },
  requestMethod: {
    type: String,
    default: null
  },
  requestUrl: {
    type: String,
    default: null
  },
  requestStatus: {
    type: Number,
    default: null
  }
})

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const dismissLabel = 'Dismiss'

const requestSummary = computed(() => {
  const method = props.requestMethod?.toUpperCase()
  const url = props.requestUrl
  return [method, url].filter(Boolean).join(' ')
})

const titleText = computed(() => {
  if (typeof props.payload?.title === 'string' && props.payload.title.trim()) {
    return props.payload.title.trim()
  }

  const status = Number.isFinite(Number(props.requestStatus))
    ? Number(props.requestStatus)
    : Number(props.payload?.status)

  if (Number.isFinite(status)) {
    return `Cloudflare proxy error (${status})`
  }
  return 'Cloudflare proxy error'
})

const whatYouShouldDo = computed(() => {
  const fromAction = props.payload?.what_you_should_do
  if (typeof fromAction === 'string' && fromAction.trim()) {
    return fromAction.trim().replaceAll('**', '')
  }

  const fromDetail = props.payload?.detail
  if (typeof fromDetail === 'string' && fromDetail.trim()) {
    return fromDetail.trim()
  }

  return 'Cloudflare reported a temporary issue between edge and origin. Please wait and retry.'
})

const detailRows = computed(() => {
  const rows = []
  const pushIfPresent = (label, value) => {
    if (value == null || value === '') {
      return
    }
    rows.push({ label, value: String(value) })
  }

  pushIfPresent('Request', requestSummary.value)
  pushIfPresent('Status', props.requestStatus ?? props.payload?.status)
  pushIfPresent('Error Name', props.payload?.error_name)
  pushIfPresent('Error Code', props.payload?.error_code)
  pushIfPresent('Ray ID', props.payload?.ray_id)
  pushIfPresent('Instance', props.payload?.instance)
  pushIfPresent('Retryable', props.payload?.retryable)
  pushIfPresent('Retry After', props.payload?.retry_after)
  pushIfPresent('Timestamp', props.payload?.timestamp)
  pushIfPresent('Zone', props.payload?.zone)
  pushIfPresent('Category', props.payload?.error_category)
  pushIfPresent('Owner Action Required', props.payload?.owner_action_required)

  return rows
})

const prettyPayload = computed(() => JSON.stringify(props.payload, null, 2))
</script>

<style scoped>
.cf-error-card {
  width: min(92vw, 760px);
  max-height: 86vh;
}

.cf-error-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.cf-logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #f38020;
}

.cf-error-table th {
  width: 180px;
  font-weight: 600;
}

.cf-raw-json {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
