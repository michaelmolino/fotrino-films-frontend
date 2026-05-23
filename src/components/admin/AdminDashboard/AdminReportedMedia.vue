<template>
  <div>
    <div class="text-h6 text-weight-bold" data-cy="admin-reported-media-title">
      Admin: Reported Videos
    </div>
    <div class="text-caption text-grey-7 q-mb-md">All videos that have been reported by users.</div>
    <div v-if="loading">
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
    </div>
    <q-table
      v-else
      flat
      bordered
      :rows="flattenedReportedMediaRows"
      :columns="reportedMediaColumns"
      row-key="rowKey"
      separator="cell"
      dense>
      <template #body-cell-title="props">
        <q-td :props="props">
          <q-btn
            :label="props.row.title"
            :to="`/private/m/${props.row.privateId}/${props.row.slug}`"
            icon="link"
            flat
            dense
            size="sm"
            :aria-label="`View reported video: ${props.row.title}`" />
        </q-td>
      </template>
      <template #body-cell-createdAt="props">
        <q-td :props="props">{{ daysSince(props.row.createdAt, true) }}</q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            dense
            size="sm"
            flat
            color="negative"
            icon="delete"
            @click="deleteMedia(props.row.privateId)">
            <q-tooltip>Delete Video</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notify } from 'quasar'
import { useAdminStore } from 'src/stores/admin-store.js'
import { daysSince } from '@utils/date.js'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'

const adminStore = useAdminStore()
const loading = ref(true)
const reportedMediaColumns = [
  { name: 'createdAt', label: 'Reported', field: 'createdAt', align: 'left' },
  { name: 'title', label: 'Video', field: 'title', align: 'left' },
  { name: 'reporter', label: 'Reporter', field: 'reporter', align: 'left' },
  { name: 'reason', label: 'Reason', field: 'reason', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]
const flattenedReportedMediaRows = computed(() => {
  const rows = []
  const reported = adminStore.reportedMedia || []
  for (const media of reported) {
    const reports = media.reports || []
    let idx = 0
    for (const report of reports) {
      rows.push({
        rowKey: media.mediaId + '-' + idx,
        mediaId: media.mediaId,
        privateId: media.privateId,
        title: media.title,
        reporter: report.reporter,
        reason: report.reason,
        createdAt: report.createdAt,
        actions: media.mediaId
      })
      idx++
    }
  }
  return rows
})

async function loadReportedMedia() {
  loading.value = true
  try {
    await adminStore.loadReportedMedia()
  } catch (err) {
    console.error('Failed to fetch reported media:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to load reported videos.'),
      icon: 'warning',
      timeout: 0
    })
  } finally {
    loading.value = false
  }
}

async function deleteMedia(privateId) {
  try {
    const deleted = await adminStore.deleteMedia(privateId)
    if (deleted === false) return
    Notify.create({
      type: 'positive',
      message: 'Reported video deleted.',
      icon: 'check',
      timeout: 2000
    })
  } catch (err) {
    console.error('Failed to delete reported media:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to delete reported videos.'),
      icon: 'warning',
      timeout: 0
    })
  }
}

watch(
  () => true,
  () => {
    loadReportedMedia()
  },
  { immediate: true }
)
</script>
