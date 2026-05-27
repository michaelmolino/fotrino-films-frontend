<template>
  <q-btn-dropdown
    v-if="hasHistory"
    icon="history"
    :label="dropdownLabel"
    aria-label="View recently visited channels"
    flat
    no-caps
    size="md"
    content-class="my-history-dropdown-menu">
    <div v-for="entry in historyEntries" :key="entry.key" class="row">
      <q-btn
        :icon="entry.icon"
        align="left"
        flat
        no-caps
        no-wrap
        class="col-xs-10"
        :label="entry.title"
        :aria-label="entry.visitLabel"
        size="md"
        :to="entry.target" />
      <q-btn
        icon="remove_circle"
        flat
        no-caps
        no-wrap
        class="col-xs-2"
        :aria-label="entry.removeLabel"
        size="md"
        @click="removeHistory(entry.resourceId, entry.type)" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { Notify, useQuasar } from 'quasar'
import { useChannelStore } from 'src/stores/channel-store.js'
import { historyChannels, removeHistory, resolveHistoryFromBackend } from '@utils/history.js'
import { buildHistoryTargetPath } from '@utils/channelRoute.js'

const channelStore = useChannelStore()
const $q = useQuasar()

const hasHistory = computed(() => (historyChannels?.value || []).length > 0)
const dropdownLabel = computed(() => ($q.screen.gt.sm ? 'History' : ''))

const historyEntries = computed(() => {
  return (historyChannels?.value || []).map(channel => ({
    key: `${channel.type}:${channel.resourceId}`,
    resourceId: channel.resourceId,
    type: channel.type,
    title: channel.title,
    icon: channel.cover ? `img:${channel.cover}` : 'movie',
    target: historyTarget(channel),
    visitLabel: `Visit ${channel.title}`,
    removeLabel: `Remove ${channel.title} from history`
  }))
})

function historyTarget(channel) {
  return buildHistoryTargetPath(channel)
}

function getRemovedHistoryMessage(removedCount) {
  if (removedCount === 1) {
    return '1 deleted item was removed from your history.'
  }
  return `${removedCount} deleted items were removed from your history.`
}

onMounted(async () => {
  const result = await resolveHistoryFromBackend(channelStore)
  const removedCount = result?.deletedItems?.length || 0

  if (removedCount > 0) {
    Notify.create({
      type: 'warning',
      timeout: 2200,
      icon: 'info',
      message: getRemovedHistoryMessage(removedCount)
    })
  }
})
</script>

<style lang="scss">
.my-history-dropdown-menu.q-menu[role='menu'] {
  max-width: none !important;
}
</style>
