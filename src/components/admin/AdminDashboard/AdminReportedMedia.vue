<template>
  <div>
    <div class="text-h6 text-weight-bold">Admin: Reported Media</div>
    <div class="text-caption text-grey-7 q-mb-md">All media that has been reported by users.</div>
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
      dense
    >
      <template #body-cell-title="props">
        <q-td :props="props">
          <q-btn
            :label="props.row.title"
            :to="`/private/${props.row.private_id}`"
            icon="fas fa-link"
            flat
            dense
            size="sm"
          />
        </q-td>
      </template>
      <template #body-cell-created_at="props">
        <q-td :props="props">{{ daysSince(props.row.created_at, true) }}</q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense size="sm" flat color="negative" icon="delete" @click="deleteMedia(props.row.private_id)">
            <q-tooltip>Delete Media</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { daysSince } from '@utils/date.js'

const $q = useQuasar()
const loading = ref(true)
const reportedMediaRows = ref([])
const reportedMediaColumns = [
  { name: 'created_at', label: 'Reported', field: 'created_at', align: 'left' },
  { name: 'title', label: 'Media', field: 'title', align: 'left' },
  { name: 'reporter', label: 'Reporter', field: 'reporter', align: 'left' },
  { name: 'reason', label: 'Reason', field: 'reason', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]
const flattenedReportedMediaRows = computed(() => {
  const rows = []
  for (const media of reportedMediaRows.value) {
    const reports = media.reports || []
    reports.forEach((report, idx) => {
      rows.push({
        rowKey: media.media_id + '-' + idx,
        media_id: media.media_id,
        private_id: media.private_id,
        title: media.title,
        reporter: report.reporter,
        reason: report.reason,
        created_at: report.created_at,
        actions: media.media_id // used for delete button
      })
    })
  }
  return rows
})

async function fetchReportedMedia() {
  loading.value = true
  try {
    const resp = await api.get('/admin/reported-media')
    reportedMediaRows.value = resp.data
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to fetch reported media.' })
  } finally {
    loading.value = false
  }
}
function deleteMedia(privateId) {
  api.delete(`/admin/media/${privateId}`)
    .then(() => {
      fetchReportedMedia()
      $q.notify({ type: 'positive', message: 'Media deleted.' })
    })
    .catch(() => {
      $q.notify({ type: 'negative', message: 'Failed to delete media.' })
    })
}

watch(
  () => true,
  () => { fetchReportedMedia() },
  { immediate: true }
)
</script>
