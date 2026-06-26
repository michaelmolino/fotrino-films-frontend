<template>
  <div>
    <div class="text-h6 text-weight-bold" data-cy="admin-maintenance-title">Admin: Maintenance</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Find and clean up stale pending uploads that can get stuck in an inconsistent state.
    </div>

    <div class="row q-col-gutter-sm items-end q-mb-sm">
      <div class="col-12 col-sm-4">
        <q-input
          v-model.number="olderThanHours"
          type="number"
          min="1"
          outlined
          dense
          label="Older Than (hours)" />
      </div>
      <div class="col-12 col-sm-4">
        <q-input v-model.number="limit" type="number" min="1" outlined dense label="Batch Limit" />
      </div>
      <div class="col-12 col-sm-4">
        <q-toggle v-model="dryRun" label="Dry Run" color="primary" left-label />
      </div>
    </div>

    <div class="q-mb-md">
      <q-btn
        color="primary"
        icon="build_circle"
        :loading="running"
        :disable="running"
        @click="runCleanup">
        {{ dryRun ? 'Scan Stale Pending Uploads' : 'Run Cleanup' }}
      </q-btn>
    </div>

    <q-card v-if="result" flat bordered>
      <q-card-section>
        <div class="text-subtitle2 text-weight-medium q-mb-sm">Last Run Summary</div>
        <div class="row q-col-gutter-md text-body2">
          <div class="col-6 col-sm-3">Dry Run: {{ result.dryRun ? 'Yes' : 'No' }}</div>
          <div class="col-6 col-sm-3">Matched: {{ result.matched }}</div>
          <div class="col-6 col-sm-3">Cleaned: {{ result.cleaned }}</div>
          <div class="col-6 col-sm-3">Errors: {{ result.errors }}</div>
          <div class="col-6 col-sm-3">Not Found: {{ result.notFound }}</div>
          <div class="col-6 col-sm-3">Hours: {{ result.olderThanHours }}</div>
          <div class="col-6 col-sm-3">Limit: {{ result.limit }}</div>
        </div>

        <q-expansion-item
          v-if="Array.isArray(result.mediaIds) && result.mediaIds.length > 0"
          dense
          expand-separator
          class="q-mt-md"
          :label="`Matched Media IDs (${result.mediaIds.length})`">
          <pre class="maintenance-result-pre q-mt-sm">{{
            JSON.stringify(result.mediaIds, null, 2)
          }}</pre>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAdminStore } from 'src/stores/admin-store.js'
import { getComponentApiErrorMessage } from 'src/utils/api-error-service.js'
import { notifyError, notifySuccess } from 'src/utils/notify.js'

const adminStore = useAdminStore()
const olderThanHours = ref(24)
const limit = ref(200)
const dryRun = ref(true)
const running = ref(false)
const result = ref(null)

async function runCleanup() {
  running.value = true
  try {
    const response = await adminStore.cleanupPendingUploads({
      dryRun: dryRun.value,
      olderThanHours: olderThanHours.value,
      limit: limit.value
    })
    result.value = response?.data || null
    notifySuccess(
      dryRun.value ? 'Pending upload scan completed.' : 'Pending upload cleanup completed.'
    )
  } catch (error) {
    console.error('Failed to run pending upload maintenance:', error)
    notifyError(getComponentApiErrorMessage(error, 'Failed to run pending upload maintenance.'), {
      timeout: 0
    })
  } finally {
    running.value = false
  }
}
</script>

<style scoped>
.maintenance-result-pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
