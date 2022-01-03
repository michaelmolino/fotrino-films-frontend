<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <NavBar />
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer reveal elevated class="bg-secondary text-white">
      <Footer />
    </q-footer>
  </q-layout>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: 'MainLayout',
  components: {
    NavBar: defineAsyncComponent(() => import('../components/NavBar.vue')),
    Footer: defineAsyncComponent(() => import('../components/Footer.vue'))
  }
}
</script>
