<template>
  <q-page :class="[heroBgClass, 'q-pa-md', 'flex', 'flex-center']">
    <section class="text-right q-pa-lg rounded-borders">
      <div>
        <transition appear enter-active-class="animated zoomInDown slower">
          <h1 class="text-h4 q-my-none">
            <span :class="darkClass">Fotrino </span>
            <span class="text-accent">Films </span>
          </h1>
        </transition>
        <transition appear enter-active-class="animated zoomInDown slower delay-1s">
          <h2 class="text-h4 q-my-none">
            <span :class="darkClass">The </span>
            <span class="text-accent">Transparent </span>
            <span :class="darkClass">Video Host</span>
          </h2>
        </transition>
      </div>
      <div class="text-subtitle1 text-center q-mt-sm q-mb-md" :class="darkClass">
        Private, ad‑free video hosting for friends and family.
      </div>
      <div class="row justify-center q-gutter-sm q-mt-md">
        <div class="col-auto">
          <q-btn
            color="accent"
            unelevated
            rounded
            size="md"
            icon="play_circle"
            label="Explore Sample Channel"
            to="/9944fa03-8a73-4e52-84bc-e8a514bd1271/Sample-Channel" />
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

defineOptions({ name: 'Home-Page' })
const $q = useQuasar()
const darkClass = computed(() => ($q.dark.isActive ? 'text-white' : 'text-secondary'))
const heroBgClass = computed(() => $q.dark.isActive && 'bg-hero-dark')
</script>

<style scoped>
.bg-hero-dark {
  background:
    radial-gradient(1000px 480px at 85% 20%, rgba(2, 123, 227, 0.28), rgba(2, 123, 227, 0) 68%),
    radial-gradient(780px 360px at 10% 88%, rgba(2, 123, 227, 0.14), rgba(2, 123, 227, 0) 62%),
    linear-gradient(180deg, rgba(2, 123, 227, 0.08) 0%, rgba(2, 123, 227, 0) 45%);
}
</style>
