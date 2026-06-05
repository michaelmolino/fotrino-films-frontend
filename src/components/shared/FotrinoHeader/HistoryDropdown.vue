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
    <q-tooltip v-if="showTooltip">History</q-tooltip>
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
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { useChannelStore } from 'src/stores/channel-store.js'
import {
  buildHistoryTargetPath,
  buildCurrentHistoryEntryFromContext,
  historyChannels,
  removeHistory,
  resolveHistoryFromBackend
} from '@utils/history.js'
import { resolveChannelRouteContext } from '@utils/channel-route.js'
import { notifyWarning } from 'src/utils/notify.js'

const channelStore = useChannelStore()
const $q = useQuasar()
const route = useRoute()

const hasHistory = computed(() => historyChannels.value.length > 0)
const dropdownLabel = computed(() => ($q.screen.gt.sm ? 'History' : ''))
const showTooltip = computed(() => !$q.screen.gt.sm)

const historyEntries = computed(() => {
  return historyChannels.value.map(channel => ({
    key: `${channel.type}:${channel.resourceId}`,
    resourceId: channel.resourceId,
    type: channel.type,
    title: channel.title,
    icon: resolveHistoryCoverIcon(channel),
    target: historyTarget(channel),
    visitLabel: `Visit ${channel.title}`,
    removeLabel: `Remove ${channel.title} from history`
  }))
})

function resolveHistoryCoverIcon(channel) {
  const url = channel.cover
  return url ? `img:${url}` : 'movie'
}

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
  const context = resolveChannelRouteContext(route)
  const currentEntry = buildCurrentHistoryEntryFromContext(context)
  const result = await resolveHistoryFromBackend(channelStore, { currentEntry })
  const removedCount = result.deletedItems.length

  if (removedCount > 0) {
    notifyWarning(getRemovedHistoryMessage(removedCount), { icon: 'info' })
  }
})
</script>

<style lang="scss">
.my-history-dropdown-menu.q-menu[role='menu'] {
  max-width: none !important;
}
</style>
