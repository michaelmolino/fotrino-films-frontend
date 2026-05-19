<template>
  <div>
    <div class="text-h6 text-weight-bold" data-cy="admin-pending-jobs-title">Admin: Pending Jobs</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Procrastinate jobs in todo state. Use "Start Now" to pull scheduled jobs forward.
    </div>
    <div v-if="loading">
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
    </div>
    <q-table
      v-else
      flat
      bordered
      :rows="pendingJobs"
      :columns="pendingColumns"
      row-key="id"
      separator="cell"
      dense
      :pagination="{ rowsPerPage: 0 }">
      <template #body-cell-scheduled="props">
        <q-td :props="props">
          {{ scheduledLabel(props.row.scheduledAt) }}
        </q-td>
      </template>
      <template #body-cell-payload="props">
        <q-td :props="props">
          <q-expansion-item dense expand-separator label="Show Payload">
            <pre style="white-space: pre-wrap">{{ pretty(props.row.args) }}</pre>
          </q-expansion-item>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense size="sm" flat color="primary" icon="play_arrow" @click="startNow(props.row.id)">
            <q-tooltip>Start Now</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import { useAdminStore } from 'src/stores/admin-store.js'
import { daysSince } from '@utils/date.js'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'

const adminStore = useAdminStore()
const loading = ref(true)
const pendingJobs = computed(() => adminStore.pendingJobs || [])
const pendingColumns = [
  { name: 'scheduled', label: 'Scheduled', field: 'scheduledAt', align: 'left' },
  { name: 'type', label: 'Task', field: 'taskName', align: 'left' },
  { name: 'queue', label: 'Queue', field: 'queueName', align: 'left' },
  { name: 'attempts', label: 'Attempts', field: 'attempts', align: 'right' },
  { name: 'payload', label: 'Payload', field: 'payload', align: 'left' },
  {
    name: 'last_error',
    label: 'Last Error',
    field: 'lastError',
    align: 'left'
  },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]

function scheduledLabel(value) {
  if (!value) {
    return 'ready now'
  }
  return daysSince(value, true)
}

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

async function startNow(jobId) {
  try {
    await adminStore.startPendingJobNow(jobId)
    Notify.create({
      type: 'positive',
      message: 'Pending job set to run now.',
      icon: 'check',
      timeout: 2000
    })
  } catch (err) {
    console.error('Failed to start pending job now:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to start pending job.'),
      icon: 'warning',
      timeout: 0
    })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await adminStore.loadPendingJobs()
  } catch (err) {
    console.error('Failed to load pending jobs:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to load pending jobs.'),
      icon: 'warning',
      timeout: 0
    })
  } finally {
    loading.value = false
  }
})
</script>
