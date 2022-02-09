<template>
  <q-layout view="hHh lpR fFf">
    <Header />
    <q-page-container>
      <router-view class="q-pa-md" />
    </q-page-container>
    <Footer />
  </q-layout>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'MainLayout',

  components: {
    Header: defineAsyncComponent(() => import('@components/shared/Header.vue')),
    Footer: defineAsyncComponent(() => import('@components/shared/Footer.vue'))
  }
}
</script>
