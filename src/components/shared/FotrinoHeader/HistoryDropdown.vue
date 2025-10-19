<template>
  <q-btn-dropdown
    v-if="isClient && history && history.length > 0"
    icon="fas fa-clock-rotate-left"
    :label="$q.screen.gt.sm ? 'History' : ''"
    flat
    no-caps
    size="md"
    content-class="my-history-dropdown-menu">
    <div v-for="channel in history" :key="channel.uuid" class="row">
      <q-btn
        :icon="channel.cover ? 'img:' + channel.cover : 'fas fa-clapperboard'"
        align="left"
        flat
        no-caps
        no-wrap
        class="col-xs-10"
        :label="channel.title"
        size="md"
        :to="`/${channel.uuid}/${channel.slug}`" />
      <q-btn
        icon="fas fa-circle-minus"
        flat
        no-caps
        no-wrap
        class="col-xs-2"
        size="md"
        @click="removeHistory(channel.uuid)" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { history, watchChannelHistory, removeHistory } from '@utils/history.js'

const isClient = ref(false)
const $store = useStore()

onMounted(() => {
  isClient.value = true
  watchChannelHistory($store)
})
</script>
