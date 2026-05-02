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
    <div v-for="channel in historyChannels" :key="channel.uuid" class="row">
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
        :to="`/${channel.uuid}/${channel.slug}`" />
      <q-btn
        icon="remove_circle"
        flat
        no-caps
        no-wrap
        class="col-xs-2"
        :aria-label="`Remove ${channel.title} from history`"
        size="md"
        @click="removeHistory(channel.uuid)" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { onMounted } from 'vue'
import { Notify } from 'quasar'
import { useStore } from 'vuex'
import {
  historyChannels,
  watchChannelHistory,
  removeHistory,
  resolveHistoryFromBackend
} from '@utils/history.js'

const $store = useStore()
watchChannelHistory($store)

onMounted(async () => {
  const result = await resolveHistoryFromBackend($store)
  const removedCount = result?.deletedUuids?.length || 0

  if (removedCount > 0) {
    Notify.create({
      type: 'warning',
      timeout: 2200,
      icon: 'info',
      message:
        removedCount === 1
          ? '1 deleted channel was removed from your history.'
          : `${removedCount} deleted channels were removed from your history.`
    })
  }
})
</script>
