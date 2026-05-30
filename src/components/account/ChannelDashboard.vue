<template>
  <div class="dashboard-page q-pa-md" data-cy="dashboard">
    <template v-if="contentState === 'ready'">
      <ProfileCard :profile="profile" data-cy="profile-card" />
      <MediaBrowser v-if="hasChannels" :channels="channels" data-cy="media-browser" />
      <NothingText v-else text="Your videos will appear here (once you have some)." />
    </template>
    <template v-else-if="contentState === 'loading'">
      <ProfileCard :profile="null" data-cy="profile-card-skeleton" />
      <q-skeleton type="rect" class="q-mt-md dashboard-media-skeleton" animation="pulse" />
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
const isAuthenticated = computed(() => !!accountStore.profile)
const channelsQuery = channelStore.useChannelsQuery(isAuthenticated)

const profile = computed(() => accountStore.profile)
const isProfileResolved = computed(() => accountStore.profileResolved)
const contentState = computed(() => {
  if (!isProfileResolved.value) {
    return 'loading'
  }
  return profile.value ? 'ready' : 'auth-required'
})
const channels = computed(() =>
  Array.isArray(channelsQuery.data.value) ? channelsQuery.data.value : []
)
const hasChannels = computed(() => channels.value.length > 0)
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
}
.dashboard-media-skeleton {
  width: 100%;
  min-height: 320px;
  border-radius: 12px;
}
</style>
