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

<script setup>
import { ref, watch, defineAsyncComponent, onMounted } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import { useRoute, useRouter } from 'vue-router'
import { useChannelLoader } from '@composables/useChannelLoader.js'

const Terms = defineAsyncComponent(() => import('@components/pages/Terms.vue'))

const accountStore = useAccountStore()
const route = useRoute()
const router = useRouter()
const { loadChannel, routeContext } = useChannelLoader({ manageMeta: true })
accountStore.useProfileQuery()

const showTerms = ref(false)

onMounted(() => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('WARNING: This is a development server and should not be exposed to the internet.')
  }
})

watch(
  () => route.query?.showTerms,
  showTermsQueryValue => {
    showTerms.value = showTermsQueryValue?.toLowerCase() === 'true'
  },
  { immediate: true }
)

watch(
  [
    () => routeContext.value.type,
    () => routeContext.value.channelPublicId,
    () => routeContext.value.albumPublicId,
    () => routeContext.value.mediaPublicId,
    () => routeContext.value.privateAlbumId,
    () => routeContext.value.privateMediaId
  ],
  async () => {
    await loadChannel(route)
  },
  { immediate: true }
)

const onTermsClose = () => {
  if (route.query?.showTerms) {
    router.replace({
      query: { ...route.query, showTerms: undefined }
    })
  }
}
</script>
