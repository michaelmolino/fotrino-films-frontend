<template>
  <div class="upload-route-entry">
    <component :is="activeComponent" />

    <div v-if="showFlowToggle" class="flow-toggle">
      <q-card flat bordered class="bg-grey-1">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-7 q-mb-xs">Upload flow (dev)</div>
          <q-btn-toggle
            v-model="selectedFlow"
            dense
            unelevated
            no-caps
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="flowOptions" />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const UploadMediaLegacy = defineAsyncComponent(() => import('@components/account/UploadMedia.vue'))
const UploadMediaComposer = defineAsyncComponent(
  () => import('@components/account/UploadMediaComposer.vue')
)

const route = useRoute()
const router = useRouter()
const showFlowToggle = import.meta.env.DEV
const flowOptions = [
  { label: 'Legacy', value: 'legacy' },
  { label: 'Composer', value: 'composer' }
]

const selectedFlow = computed({
  get() {
    const flow = String(route.query.flow || '').toLowerCase()
    if (flow === 'composer') {
      return flow
    }
    return 'legacy'
  },
  set(nextFlow) {
    const nextQuery = { ...route.query }
    if (nextFlow === 'legacy') {
      delete nextQuery.flow
    } else {
      nextQuery.flow = nextFlow
    }
    router.replace({ query: nextQuery })
  }
})

const activeComponent = computed(() => {
  const flow = String(route.query.flow || '').toLowerCase()
  if (flow === 'composer') {
    return UploadMediaComposer
  }
  return UploadMediaLegacy
})
</script>

<style scoped>
.upload-route-entry {
  position: relative;
}

.flow-toggle {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 3000;
  max-width: calc(100vw - 24px);
}
</style>
