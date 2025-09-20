<template>
  <div v-if="profile?.id" class="q-pa-md">
    <ProfileCard :profile="profile" :mediaCount="mediaCount" />
    <MediaBrowser v-if="channels.length > 0" :channels="channels" />
    <NothingText v-if="channels.length === 0" text="Your media will appear here (once you have some)."/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
export default {
  name: 'ChannelDashboard',

  components: {
    ProfileCard: defineAsyncComponent(() =>
      import('@components/account/ProfileCard.vue')
    ),
    MediaBrowser: defineAsyncComponent(() =>
      import('@components/account/MediaBrowser.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  computed: {
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    },
    channels: {
      get() {
        return this.$store.state.channel.channels
      }
    },
    mediaCount() {
      let count = 0
      this.channels?.forEach(channel => {
        channel.projects?.forEach(project => {
          count += project.media.length
        })
      })
      return count
    }
  },

  created: function() {
    this.$store.dispatch('channel/getChannels', true)
  }
}
</script>

<style scoped>
.terms {
  max-height: 50vh
}
</style>
