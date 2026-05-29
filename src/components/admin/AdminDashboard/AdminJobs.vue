<template>
  <div>
    <div class="text-h6 text-weight-bold" data-cy="admin-jobs-title">Admin: Jobs</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Procrastinate jobs by status (excluding completed and skipped jobs).
    </div>

    <div class="q-mb-md flex items-center gap-sm">
      <span class="text-body2 text-weight-medium">Filter:</span>
      <q-option-group v-model="filterMode" :options="statusFilterOptions" color="primary" inline />
    </div>

    <div v-if="loading">
      <q-skeleton v-for="row in loadingRows" :key="row" type="rect" height="40px" class="q-mb-sm" />
    </div>

    <q-table
      v-else
      flat
      bordered
      :rows="filteredJobs"
      :columns="jobColumns"
      row-key="id"
      separator="cell"
      dense
      :pagination="tablePagination">
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="statusColor(props.row.status)"
            text-color="white"
            class="text-capitalize">
            {{ props.row.status }}
          </q-chip>
        </q-td>
      </template>
      <template #body-cell-when="props">
        <q-td :props="props">
          {{ getWhenLabel(props.row) }}
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
          <q-btn
            v-if="props.row.status === 'todo'"
            dense
            size="sm"
            flat
            color="primary"
            icon="play_arrow"
            @click="runAction(props.row)">
            <q-tooltip>Start Now</q-tooltip>
          </q-btn>
          <q-btn
            v-else-if="props.row.status === 'failed'"
            dense
            size="sm"
            flat
            color="info"
            icon="refresh"
            @click="runAction(props.row)">
            <q-tooltip>Requeue</q-tooltip>
          </q-btn>
          <span v-else class="text-grey-6">-</span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { useAdminStore } from 'src/stores/admin-store.js'
import { daysSince } from '@utils/date.js'
import { getComponentApiErrorMessage } from 'src/utils/api-error-service.js'
import { notifyError } from 'src/utils/notify.js'

const adminStore = useAdminStore()
const JOB_FILTER_KEY = 'admin.jobs.filterMode'
const JOB_FILTER_VALUES = new Set(['all', 'todo', 'doing', 'failed'])

function getInitialJobFilterMode() {
  if (globalThis.window === undefined) {
    return 'all'
  }
  const saved = globalThis.localStorage.getItem(JOB_FILTER_KEY)
  return JOB_FILTER_VALUES.has(saved) ? saved : 'all'
}

const filterMode = ref(getInitialJobFilterMode())
const jobsQuery = adminStore.useJobsQuery()
const jobs = computed(() => adminStore.jobs || [])
const loading = computed(() => jobsQuery.isLoading.value && jobs.value.length === 0)
const loadingRows = [1, 2, 3]
const tablePagination = { rowsPerPage: 0 }

const FILTER_STATUSES = [
  { value: 'todo', label: 'Pending' },
  { value: 'doing', label: 'Running' },
  { value: 'failed', label: 'Failed' }
]

const statusCounts = computed(() => {
  const counts = {
    todo: 0,
    doing: 0,
    failed: 0
  }
  for (const job of jobs.value) {
    const status = String(job?.status || '')
    if (status in counts) {
      counts[status] += 1
    }
  }
  return counts
})

const statusFilterOptions = computed(() => {
  const allCount = jobs.value.length
  const options = [{ label: `All Jobs (${allCount})`, value: 'all' }]
  for (const status of FILTER_STATUSES) {
    options.push({
      label: `${status.label} (${statusCounts.value[status.value] || 0})`,
      value: status.value
    })
  }
  return options
})

watch(filterMode, value => {
  if (globalThis.window === undefined) {
    return
  }
  if (JOB_FILTER_VALUES.has(value)) {
    globalThis.localStorage.setItem(JOB_FILTER_KEY, value)
  }
})

const filteredJobs = computed(() => {
  if (filterMode.value === 'all') {
    return jobs.value
  }
  return jobs.value.filter(job => job.status === filterMode.value)
})

const jobColumns = [
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'when', label: 'When', field: 'scheduledAt', align: 'left' },
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

function statusColor(status) {
  if (status === 'failed') return 'negative'
  if (status === 'todo') return 'primary'
  if (status === 'doing') return 'warning'
  return 'grey-6'
}

function getWhenLabel(job) {
  const value = job.status === 'failed' ? job.failedAt : job.scheduledAt
  if (!value) {
    return '-'
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

async function runAction(job) {
  try {
    const result = await adminStore.runJobAction(job)
    const action = result?.data
    Notify.create({
      type: 'positive',
      message:
        action === 'started' ? 'Pending job set to run now.' : 'Failed job replay requested.',
      icon: 'check',
      timeout: 2000
    })
  } catch (err) {
    console.error('Failed to run admin job action:', err)
    notifyError(getComponentApiErrorMessage(err, 'Failed to run admin job action.'), {
      timeout: 0
    })
  }
}

watch(
  () => jobsQuery.error.value,
  err => {
    if (!err) {
      return
    }
    console.error('Failed to load jobs:', err)
    notifyError(getComponentApiErrorMessage(err, 'Failed to load jobs.'), {
      timeout: 0
    })
  }
)
</script>
