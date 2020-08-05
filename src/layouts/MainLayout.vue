<template>
  <q-layout view="hHh lpR fFf">
    <NavBar />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import NavBar from '../components/NavBar.vue'

export default {
  name: 'MainLayout',
  components: {
    NavBar
  }
}
</script>
