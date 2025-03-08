<template>
  <div v-if="profile?.id" class="q-pa-md">
    <ProfileCard :profile="profile" :mediaCount="mediaCount" />
    <MediaBrowser v-if="channels.length > 0" :channels="channels" />
    <NothingText v-if="channels.length === 0" text="Your media will appear here (once you have some)."/>
    <q-dialog v-model="showTerms" backdrop-filter="contrast(40%)">
      <q-card>
        <q-card-section style="max-height: 50vh" class="scroll">
          <Terms />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
    Terms: defineAsyncComponent(() =>
      import('@components/pages/Terms.vue')
    ),
    NothingText: defineAsyncComponent(() =>
      import('@components/shared/NothingText.vue')
    )
  },

  data() {
    return {
      showTerms: this.$route.query.showTerms === 'true'
    }
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
