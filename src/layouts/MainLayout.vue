<template>
  <q-layout view="hHh lpR fFf">
    <FotrinoHeader />
    <q-page-container>
      <router-view class="q-pa-md" />
    </q-page-container>
    <FotrinoFooter />
  </q-layout>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'MainLayout',

  components: {
    FotrinoHeader: defineAsyncComponent(() => import('@components/shared/FotrinoHeader.vue')),
    FotrinoFooter: defineAsyncComponent(() => import('@components/shared/FotrinoFooter.vue'))
  }
}
</script>
