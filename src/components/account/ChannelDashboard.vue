<template>
  <div class="dashboard-page q-pa-md" data-cy="dashboard">
    <template v-if="contentState === 'ready'">
      <ProfileCard :profile="profile" :mediaCount="mediaCount" data-cy="profile-card" />
      <MediaBrowser v-if="hasChannels" :channels="channels" data-cy="media-browser" />
      <NothingText v-else text="Your videos will appear here (once you have some)." />
    </template>
    <AuthRequired v-else type="login" message="Please log in to access your dashboard" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import { useChannelStore } from 'src/stores/channel-store.js'
import ProfileCard from '@components/account/ChannelDashboard/ProfileCard.vue'
import MediaBrowser from '@components/account/ChannelDashboard/MediaBrowser.vue'
import NothingText from '@components/shared/NothingText.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'

const accountStore = useAccountStore()
const channelStore = useChannelStore()
const channelsQuery = channelStore.useChannelsQuery(true)

const profile = computed(() => accountStore.profile)
const contentState = computed(() => (profile.value ? 'ready' : 'auth-required'))
const channels = computed(() => channelsQuery.data.value || [])
const hasChannels = computed(() => channels.value.length > 0)
const mediaCount = computed(() =>
  channels.value.reduce((total, ch) => {
    const albumMediaCount = (ch.albums || []).reduce((sum, p) => sum + (p.media || []).length, 0)
    return total + albumMediaCount
  }, 0)
)
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
