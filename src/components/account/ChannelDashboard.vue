<template>
  <div class="dashboard-page q-pa-md" data-cy="dashboard">
    <template v-if="profile?.id">
      <ProfileCard :profile="profile" :mediaCount="mediaCount" data-cy="profile-card" />
      <MediaBrowser v-if="hasChannels" :channels="channels" data-cy="media-browser" />
      <NothingText v-else text="Your media will appear here (once you have some)." />
    </template>
    <AuthRequired v-else type="login" message="Please log in to access your dashboard" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import ProfileCard from '@components/account/ChannelDashboard/ProfileCard.vue'
import MediaBrowser from '@components/account/ChannelDashboard/MediaBrowser.vue'
import NothingText from '@components/shared/NothingText.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'

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

onMounted(async () => {
  try {
    await store.dispatch('channel/getChannels', true)
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
