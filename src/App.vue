<template>
  <q-dialog v-model="showTerms" backdrop-filter="contrast(40%)">
      <q-card>
        <q-card-section class="scroll terms">
          <Terms />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  <router-view />
</template>

<script>
import { useMeta } from 'quasar'
import { ref, defineAsyncComponent } from 'vue'
import { getMetaData } from '@javascript/library.js'

export default {
  name: 'App',

  components: {
    Terms: defineAsyncComponent(() =>
      import('@components/pages/Terms.vue')
    )
  },

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
    if (process.env.NODE_ENV === 'development') {
      console.log('WARNING: This is a development server and should not be exposed to the internet.')
    }
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
    },
    showTerms: {
      get() {
        return this.$route.query?.showTerms === 'true'
      },
      set(value) {
        if (!value) {
          this.$router.replace({
            query: { ...this.$route.query, showTerms: undefined },
            params: { channelSlug: this.channel?.slug }
          })
        }
      }
    }
  },

  watch: {
    $route(to, from) {
      if (to.query?.showTerms) {
        this.showTerms = true
      }
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
    channel(newChannel) {
      if (newChannel?.uuid && !this.showTerms) {
        this.$router.replace({
          params: { channelSlug: newChannel.slug }
        })
      }
    }
  }
}
</script>
