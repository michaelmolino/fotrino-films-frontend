<template>
  <div>
    <div class="text-h6 text-weight-bold" data-cy="admin-reported-media-title">
      Admin: Reported Videos
    </div>
    <div class="text-caption text-grey-7 q-mb-md">All videos that have been reported by users.</div>
    <div v-if="loading">
      <q-skeleton v-for="row in loadingRows" :key="row" type="rect" height="40px" class="q-mb-sm" />
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
            :to="props.row.canonicalPath.privatePath"
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
import { computed, watch } from 'vue'
import { useAdminStore } from 'src/stores/admin-store.js'
import { daysSince } from '@utils/date.js'
import { getComponentApiErrorMessage } from 'src/utils/api-error-service.js'
import { notifyError, notifySuccess } from 'src/utils/notify.js'

const adminStore = useAdminStore()
const reportedMediaQuery = adminStore.useReportedMediaQuery()
const loadingRows = [1, 2, 3]
const reportedMedia = computed(() => reportedMediaQuery.data.value || [])
const loading = computed(
  () => reportedMediaQuery.isLoading.value && reportedMedia.value.length === 0
)
const reportedMediaColumns = [
  { name: 'createdAt', label: 'Reported', field: 'createdAt', align: 'left' },
  { name: 'title', label: 'Video', field: 'title', align: 'left' },
  { name: 'reporter', label: 'Reporter', field: 'reporter', align: 'left' },
  { name: 'reason', label: 'Reason', field: 'reason', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]
const flattenedReportedMediaRows = computed(() => {
  const rows = []
  const reported = reportedMedia.value
  for (const media of reported) {
    if (!media?.privateId) {
      continue
    }
    const reports = media.reports || []
    let idx = 0
    for (const report of reports) {
      rows.push({
        rowKey: `${media.privateId}-${idx}`,
        privateId: media.privateId,
        slug: media.slug,
        canonicalPath: media.canonicalPath,
        title: media.title,
        reporter: report.reporter,
        reason: report.reason,
        createdAt: report.createdAt,
        actions: media.privateId
      })
      idx++
    }
  }
  return rows
})

async function deleteMedia(privateId) {
  try {
    const result = await adminStore.deleteMedia(privateId)
    if (result?.cancelled || result?.ok === false) return
    notifySuccess('Reported video deleted.')
  } catch (err) {
    console.error('Failed to delete reported media:', err)
    notifyError(getComponentApiErrorMessage(err, 'Failed to delete reported videos.'), {
      timeout: 0
    })
  }
}

watch(
  () => reportedMediaQuery.error.value,
  err => {
    if (!err) {
      return
    }
    console.error('Failed to fetch reported media:', err)
    notifyError(getComponentApiErrorMessage(err, 'Failed to load reported videos.'), {
      timeout: 0
    })
  }
)
</script>
