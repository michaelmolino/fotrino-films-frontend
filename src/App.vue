<template>
  <q-dialog v-model="showTerms" @hide="onTermsClose" backdrop-filter="contrast(40%)">
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
import { ref, watch, defineAsyncComponent, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { getMetaData } from '@utils/meta.js'

export default {
  name: 'App',

  components: {
    Terms: defineAsyncComponent(() => import('@components/pages/Terms.vue'))
  },

  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()

    const metaData = ref(getMetaData(null, null))
    const showTerms = ref(false)

    useMeta(() => metaData.value)

    const onRouteChange = async () => {
      try {
        let channel = null
        if (route.params?.uuid) {
          channel = await store.cache.dispatch('channel/getChannel', {
            uuid: route.params.uuid,
            pending: false
          })
          store.commit('channel/SET_CHANNEL', channel)
        } else if (route.params?.privateId) {
          channel = await store.cache.dispatch('channel/getPrivateMedia', route.params.privateId)
          store.commit('channel/SET_CHANNEL', channel)
        }
        if (channel?.uuid) {
          router.replace({
            params: { channelSlug: channel.slug },
            query: route.query
          })
        }
        metaData.value = getMetaData(route, channel)
      } catch {
        metaData.value = getMetaData(null, null)
        store.commit('channel/SET_CHANNEL', null)
      }
    }

    onMounted(() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'WARNING: This is a development server and should not be exposed to the internet.'
        )
      }
      store.dispatch('account/getProfile')
    })

    watch(
      () => route.fullPath,
      () => {
        showTerms.value = route.query?.showTerms === 'true'
        onRouteChange()
      }
    )

    const onTermsClose = () => {
      if (route.query?.showTerms) {
        router.replace({
          query: { ...route.query, showTerms: undefined }
        })
      }
    }

    return {
      metaData,
      showTerms,
      onTermsClose
    }
  }
}
</script>
