<template>
  <div>
    <div class="text-h6 text-weight-bold" data-cy="admin-reported-media-title">Admin: Reported Media</div>
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
      dense>
      <template #body-cell-title="props">
        <q-td :props="props">
          <q-btn
            :label="props.row.title"
            :to="`/private/${props.row.privateId}`"
            icon="link"
            flat
            dense
            size="sm"
            :aria-label="`View reported media: ${props.row.title}`" />
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
            <q-tooltip>Delete Media</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Notify } from 'quasar'
import { useStore } from 'vuex'
import { daysSince } from '@utils/date.js'
import { getComponentApiErrorMessage } from 'src/utils/api-errors.js'

const store = useStore()
const loading = ref(true)
const reportedMediaColumns = [
  { name: 'createdAt', label: 'Reported', field: 'createdAt', align: 'left' },
  { name: 'title', label: 'Media', field: 'title', align: 'left' },
  { name: 'reporter', label: 'Reporter', field: 'reporter', align: 'left' },
  { name: 'reason', label: 'Reason', field: 'reason', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]
const flattenedReportedMediaRows = computed(() => {
  const rows = []
  const reported = store.state.admin.reportedMedia || []
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

async function fetchReportedMedia() {
  loading.value = true
  try {
    await store.dispatch('admin/getReportedMedia')
  } catch (err) {
    console.error('Failed to fetch reported media:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to load reported media.'),
      icon: 'warning',
      timeout: 0
    })
  } finally {
    loading.value = false
  }
}

async function deleteMedia(privateId) {
  try {
    await store.dispatch('admin/deleteMedia', privateId)
    Notify.create({
      type: 'positive',
      message: 'Reported media deleted.',
      icon: 'check',
      timeout: 2000
    })
  } catch (err) {
    console.error('Failed to delete reported media:', err)
    Notify.create({
      type: 'negative',
      message: getComponentApiErrorMessage(err, 'Failed to delete reported media.'),
      icon: 'warning',
      timeout: 0
    })
  }
}

watch(
  () => true,
  () => {
    fetchReportedMedia()
  },
  { immediate: true }
)
</script>
