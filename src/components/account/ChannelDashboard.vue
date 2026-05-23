<template>
  <div class="dashboard-page q-pa-md" data-cy="dashboard">
    <template v-if="profile?.id">
      <ProfileCard :profile="profile" :mediaCount="mediaCount" data-cy="profile-card" />
      <MediaBrowser v-if="hasChannels" :channels="channels" data-cy="media-browser" />
      <NothingText v-else text="Your videos will appear here (once you have some)." />
    </template>
    <AuthRequired v-else type="login" message="Please log in to access your dashboard" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import { useChannelStore } from 'src/stores/channel-store.js'
import ProfileCard from '@components/account/ChannelDashboard/ProfileCard.vue'
import MediaBrowser from '@components/account/ChannelDashboard/MediaBrowser.vue'
import NothingText from '@components/shared/NothingText.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'

const accountStore = useAccountStore()
const channelStore = useChannelStore()

const profile = computed(() => accountStore.profile)
const channels = computed(() => channelStore.channels || [])
const hasChannels = computed(() => channels.value.length > 0)
const mediaCount = computed(() =>
  channels.value.reduce((total, ch) => {
    const albumMediaCount = (ch.albums || []).reduce(
      (sum, p) => sum + (p.media || []).length,
      0
    )
    return total + albumMediaCount
  }, 0)
)

onMounted(async () => {
  try {
    await channelStore.loadChannels(true)
  } catch (error) {
    const apiError = getGlobalApiErrorPayload(error)
    console.debug('Dashboard API call failed:', apiError?.error || error?.response?.status)
  }
})
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
}
.skeleton-square {
  width: 250px;
  height: 250px;
}
</style>
