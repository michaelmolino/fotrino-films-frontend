<template>
  <div>
    <div class="text-h6 text-weight-bold">Admin: Dead Letter Queue</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Events that exhausted retries or were marked dead.
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
      :rows="outboxDead"
      :columns="outboxColumns"
      row-key="id"
      separator="cell"
      dense
      :pagination="{ rowsPerPage: 0 }">
      <template #body-cell-created="props">
        <q-td :props="props">{{ daysSince(props.row.created, true) }}</q-td>
      </template>
      <template #body-cell-payload="props">
        <q-td :props="props">
          <q-expansion-item dense expand-separator label="Show Payload">
            <pre style="white-space: pre-wrap">{{ pretty(props.row.payload) }}</pre>
          </q-expansion-item>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense size="sm" flat color="info" icon="refresh" @click="requeue(props.row.id)">
            <q-tooltip>Requeue</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { daysSince } from '@utils/date.js'

const store = useStore()
const loading = ref(true)
const outboxDead = computed(() => store.state.admin.outboxDead || [])
const outboxColumns = [
  { name: 'created', label: 'Created', field: 'created', align: 'left' },
  { name: 'type', label: 'Type', field: 'type', align: 'left' },
  { name: 'attempts', label: 'Attempts', field: 'attempts', align: 'right' },
  { name: 'payload', label: 'Payload', field: 'payload', align: 'left' },
  { name: 'last_error', label: 'Last Error', field: 'last_error', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]
function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
function requeue(eventId) {
  store.dispatch('admin/requeueOutbox', eventId)
}

onMounted(async () => {
  loading.value = true
  try {
    await store.dispatch('admin/getDeadOutbox')
  } finally {
    loading.value = false
  }
})
</script>
