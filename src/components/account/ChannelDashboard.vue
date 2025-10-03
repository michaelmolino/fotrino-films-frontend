<template>
  <div class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-md">Dashboard</div>

    <template v-if="profile?.id">
      <div class="text-h6 text-weight-bold q-mb-sm">Profile</div>
      <ProfileCard :profile="profile" :mediaCount="mediaCount" />
      <div v-if="hasChannels" class="text-h6 text-weight-bold q-mt-md q-mb-sm">Media Browser</div>
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

.card-dashboard {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}
</style>
