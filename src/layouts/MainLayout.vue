<template>
  <q-layout view="hHh lpR fFf">
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <FotrinoHeader />
    <main id="main-content">
      <q-page-container>
        <router-view />
      </q-page-container>
    </main>
    <FotrinoFooter />
  </q-layout>
</template>

<script>
import FotrinoHeader from '@components/shared/FotrinoHeader.vue'
import FotrinoFooter from '@components/shared/FotrinoFooter.vue'

export default {
  name: 'MainLayout',
  components: { FotrinoHeader, FotrinoFooter }
}
</script>

<style>
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 8px 16px;
  background-color: #8d6a9f;
  color: #000000;
  text-decoration: none;
  font-weight: bold;
}
.skip-to-content:focus {
  left: 50%;
  top: 8px;
  transform: translateX(-50%);
}
</style>
