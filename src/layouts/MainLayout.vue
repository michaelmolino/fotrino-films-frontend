<template>
  <q-layout :class="$q.dark.isActive ? 'bg-hero-dark' : ''" view="hHh lpR fFf">
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
import { useQuasar } from 'quasar'
import FotrinoHeader from '@components/shared/FotrinoHeader.vue'
import FotrinoFooter from '@components/shared/FotrinoFooter.vue'

export default {
  name: 'MainLayout',
  setup() {
    const $q = useQuasar()
    return { $q }
  },
  components: { FotrinoHeader, FotrinoFooter }
}
</script>

<style lang="scss">
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

.bg-hero-dark {
  background:
    radial-gradient(1000px 480px at 85% 20%, rgba($primary, 0.28), rgba($primary, 0) 68%),
    radial-gradient(780px 360px at 10% 88%, rgba($primary, 0.14), rgba($primary, 0) 62%),
    linear-gradient(180deg, rgba($accent, 0.08) 0%, rgba($accent, 0) 45%);
}
</style>
