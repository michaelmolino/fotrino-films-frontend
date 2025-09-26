<template>
  <div class="q-pa-md">
    <template v-if="profile?.id">
      <ProfileCard :profile="profile" :mediaCount="mediaCount" />
      <MediaBrowser v-if="hasChannels" :channels="channels" />
      <NothingText v-else text="Your media will appear here (once you have some)." />
    </template>
    <template v-else>
      <q-skeleton type="rect" class="q-mb-md skeleton-square" />
      <q-skeleton type="text" width="40%" />
      <q-skeleton type="text" width="60%" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import ProfileCard from '@components/account/ProfileCard.vue'
import MediaBrowser from '@components/account/MediaBrowser.vue'
import NothingText from '@components/shared/NothingText.vue'

defineOptions({ name: 'ChannelDashboard' })

const store = useStore()

const profile = computed(() => store.state.account.profile)
const channels = computed(() => store.state.channel.channels || [])
const hasChannels = computed(() => channels.value.length > 0)
const mediaCount = computed(() =>
  channels.value.reduce((total, ch) => {
    const projectMediaCount = (ch.projects || []).reduce(
      (sum, p) => sum + (p.media || []).length,
      0
    )
    return total + projectMediaCount
  }, 0)
)

onMounted(() => {
  store.dispatch('channel/getChannels', true)
})
</script>

<style scoped>
.skeleton-square {
  width: 250px;
  height: 250px;
}

.terms {
  max-height: 50vh;
}
</style>
