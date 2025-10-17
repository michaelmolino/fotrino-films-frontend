<template>
  <q-dialog v-model="showTerms" @hide="onTermsClose" backdrop-filter="contrast(40%)">
    <q-card>
      <q-card-section class="scroll">
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
import { ref, watch, defineAsyncComponent, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'

export default {
  name: 'App',

  components: {
    Terms: defineAsyncComponent(() => import('@components/pages/Terms.vue'))
  },

  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const { loadChannel } = useChannelLoader()

    const showTerms = ref(false)

    onMounted(async () => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'WARNING: This is a development server and should not be exposed to the internet.'
        )
      }
      try {
        await store.dispatch('account/getProfile')
      } catch (error) {
        console.debug('Profile fetch failed:', error.response?.status)
      }
      showTerms.value = route.query?.showTerms?.toLowerCase() === 'true'
      await loadChannel(route)
    })

    watch(
      () => route.fullPath,
      async () => {
        await loadChannel(route)
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
      showTerms,
      onTermsClose
    }
  }
}
</script>
