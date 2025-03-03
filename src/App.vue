<template>
  <router-view />
</template>

<script>
import { useMeta } from 'quasar'
import { ref } from 'vue'
import { getMetaData } from '@javascript/library.js'

export default {
  name: 'App',

  setup() {
    const metaData = ref(getMetaData(null, null))
    useMeta(() => {
      return metaData.value
    })
    return {
      metaData
    }
  },

  created() {
    this.$store.dispatch('account/getProfile')
  },

  computed: {
    channel: {
      get() {
        if (this.$route.params?.uuid || this.$route.params.privateId) {
          return this.$store.state.channel.channel
        }
        return null
      },
      set(value) {
        this.$store.commit('channel/SET_CHANNEL', value)
      }
    }
  },

  watch: {
    $route(to, from) {
      if (to.params?.uuid) {
        this.$store.cache
          .dispatch('channel/getChannel', { uuid: to.params.uuid, pending: false })
          .then(_channel => {
            this.channel = _channel
            this.metaData = getMetaData(this.$route, _channel)
          })
          .catch(() => {
            this.channel = null
          })
      } else if (to.params?.privateId) {
        this.$store.cache
          .dispatch('channel/getPrivateMedia', to.params.privateId)
          .then(_channel => {
            this.channel = _channel
            this.metaData = getMetaData(this.$route, _channel)
          })
          .catch(() => {
            this.channel = null
          })
      } else {
        this.metaData = getMetaData(this.$route, null)
      }
    },

    channel() {
      if (this.channel?.uuid) {
        this.$router.replace({
          params: { channelSlug: this.channel.slug }
        })
      }
    }
  }
}
</script>
