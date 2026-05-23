<template>
  <q-layout view="hHh lpR fFf" :class="{ 'bg-hero-dark': isDark, 'bg-hero-light': !isDark }">
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
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import FotrinoHeader from '@components/shared/FotrinoHeader.vue'
import FotrinoFooter from '@components/shared/FotrinoFooter.vue'

export default {
  name: 'MainLayout',
  components: { FotrinoHeader, FotrinoFooter },
  setup() {
    const $q = useQuasar()
    return {
      isDark: computed(() => $q.dark.isActive)
    }
  }
}
</script>

<style scoped lang="scss">
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
  position: relative;
  isolation: isolate;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(1000px 480px at 85% 20%, rgba($primary, 0.45), rgba($primary, 0) 68%),
      radial-gradient(780px 360px at 10% 88%, rgba($secondary, 0.3), rgba($secondary, 0) 62%);
  }
}

.bg-hero-light {
  // TODO: Add light mode background gradients
}
</style>
