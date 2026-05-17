<template>
  <q-page :class="isDark ? 'bg-hero-dark' : ''" class="q-pa-md flex flex-center" data-cy="home-page">
    <section class="text-right q-pa-lg rounded-borders" data-cy="home-hero">
      <div>
        <transition appear enter-active-class="animated zoomInDown slower">
          <h1 class="text-h4 q-my-none" data-cy="home-title-primary">
            <span :class="darkClass">Fotrino </span>
            <span class="text-accent">Films </span>
          </h1>
        </transition>
        <transition appear enter-active-class="animated zoomInDown slower delay-1s">
          <h2 class="text-h4 q-my-none" data-cy="home-title-secondary">
            <span :class="darkClass">The </span>
            <span class="text-accent">Transparent </span>
            <span :class="darkClass">Video Host</span>
          </h2>
        </transition>
      </div>
      <div class="text-subtitle1 text-center q-mt-sm q-mb-md" :class="darkClass" data-cy="home-subtitle">
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
            data-cy="home-explore-sample-channel"
            :to="sampleChannelPath" />
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
const sampleChannelPath = `/c/${process.env.SAMPLE_CHANNEL_ID}/${process.env.SAMPLE_CHANNEL_SLUG}`
const darkClass = computed(() => ($q.dark.isActive ? 'text-white' : 'text-primary'))
const isDark = computed(() => $q.dark.isActive)
</script>

<style scoped lang="scss">
.bg-hero-dark {
  position: relative;
  isolation: isolate;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(1000px 480px at 85% 20%, rgba(var(--q-primary-rgb), 0.45), rgba(var(--q-primary-rgb), 0) 68%),
      radial-gradient(780px 360px at 10% 88%, rgba(var(--q-secondary-rgb), 0.14), rgba(var(--q-secondary-rgb), 0) 62%);
  }
}
</style>
