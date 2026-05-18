<template>
  <q-btn-dropdown
    v-if="historyChannels && historyChannels.length > 0"
    icon="history"
    :label="$q.screen.gt.sm ? 'History' : ''"
    aria-label="View recently visited channels"
    flat
    no-caps
    size="md"
    content-class="my-history-dropdown-menu">
    <div v-for="channel in historyChannels" :key="`${channel.type}:${channel.publicId}`" class="row">
      <q-btn
        :icon="channel.cover ? 'img:' + channel.cover : 'movie'"
        align="left"
        flat
        no-caps
        no-wrap
        class="col-xs-10"
        :label="channel.title"
        :aria-label="`Visit ${channel.title}`"
        size="md"
        :to="channel.type === 'private' ? `/private/m/${channel.publicId}/${channel.slug}` : `/c/${channel.publicId}/${channel.slug}`" />
      <q-btn
        icon="remove_circle"
        flat
        no-caps
        no-wrap
        class="col-xs-2"
        :aria-label="`Remove ${channel.title} from history`"
        size="md"
        @click="removeHistory(channel.publicId, channel.type)" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { Notify } from 'quasar'
import { useChannelStore } from 'src/stores/channel-store.js'
import {
  historyChannels,
  watchChannelHistory,
  removeHistory,
  resolveHistoryFromBackend
} from '@utils/history.js'

const channelStore = useChannelStore()
const stopWatchingHistory = watchChannelHistory(channelStore)

onBeforeUnmount(() => {
  if (typeof stopWatchingHistory === 'function') {
    stopWatchingHistory()
  }
})

onMounted(async () => {
  const result = await resolveHistoryFromBackend(channelStore)
  const removedCount = result?.deletedPublicIds?.length || 0

  if (removedCount > 0) {
    Notify.create({
      type: 'warning',
      timeout: 2200,
      icon: 'info',
      message:
        removedCount === 1
          ? '1 deleted item was removed from your history.'
          : `${removedCount} deleted items were removed from your history.`
    })
  }
})
</script>

<style scoped lang="scss">
.my-history-dropdown-menu.q-menu[role='menu'] {
  max-width: none !important;
}
</style>
