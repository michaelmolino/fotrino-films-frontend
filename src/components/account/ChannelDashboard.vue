<template>
  <div v-if="profile?.id" class="q-pa-md">
    <q-img :src="profile.profile_pic" style="width: 250px" :ratio="1 / 1" fit="cover">
      <q-badge class="bg-accent q-pa-md" floating transparent>
        <q-icon :name="'fab fa-' + profile.identity_provider" />
      </q-badge>
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ profile.name }}</div>
        <div class="ellipsis">{{ profile.email }}</div>
      </div>
    </q-img>
    <div class="text-h6 q-pt-md">
      Channels
    </div>
    <div v-for="c in channels" :key="c.id" class="q-py-xs">
      <q-btn flat :to="'/' + c.uuid + '/' + c.slug" align="left" style="width: 100%; max-width: 480px" no-wrap>
        <q-avatar>
          <img :src="c.cover" :alt="profile.name">
        </q-avatar>
        <div class="q-pl-md ellipsis">{{ c.title }}</div>
      </q-btn>
    </div>
    <NothingText v-if="channels.length === 0" text="Click Account and upload some media to get started."/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
export default {
  name: 'Channel-Dashboard',

  components: {
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
    }
  },

  created: function() {
    this.$store.cache.dispatch('channel/getChannels').catch(error => { console.log(error) })
  }
}
</script>
