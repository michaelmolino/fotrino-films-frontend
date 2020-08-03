<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary">
      <Header />
    </q-header>

    <q-page-container>
      <router-view class="q-pa-md" />
    </q-page-container>

    <q-footer reveal elevated class="bg-secondary">
      <Footer />
    </q-footer>
  </q-layout>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'MainLayout',

  components: {
    Header: defineAsyncComponent(() => import('@components/Header.vue')),
    Footer: defineAsyncComponent(() => import('@components/Footer.vue'))
  }
}
</script>
