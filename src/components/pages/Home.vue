<template>
  <q-page class="q-pa-md flex flex-center" data-cy="home-page">
    <section class="text-right q-pa-lg rounded-borders" data-cy="home-hero">
      <div>
        <transition appear enter-active-class="animated zoomInDown slower">
          <h1 class="text-h4 q-my-none" data-cy="home-title-primary">
            <span :class="textToneClass">{{ content.titlePrimaryLeft }}</span>
            <span class="text-accent">{{ content.titlePrimaryRight }}</span>
          </h1>
        </transition>
        <transition appear enter-active-class="animated zoomInDown slower delay-1s">
          <h2 class="text-h4 q-my-none" data-cy="home-title-secondary">
            <span :class="textToneClass">{{ content.titleSecondaryLeft }} </span>
            <span class="text-accent">Transparent </span>
            <span :class="textToneClass">{{ content.titleSecondaryRight }}</span>
          </h2>
        </transition>
      </div>
      <div
        class="text-subtitle1 text-center q-mt-sm q-mb-md"
        :class="textToneClass"
        data-cy="home-subtitle">
        {{ content.subtitle }}
      </div>
      <div class="row justify-center q-gutter-sm q-mt-md">
        <div class="col-auto">
          <q-btn
            color="accent"
            unelevated
            rounded
            size="md"
            icon="play_circle"
            :label="content.ctaLabel"
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
const textToneClass = computed(() => ($q.dark.isActive ? 'text-white' : 'text-primary'))
const content = {
  titlePrimaryLeft: 'Fotrino ',
  titlePrimaryRight: 'Films',
  titleSecondaryLeft: 'The',
  titleSecondaryRight: 'Video Host',
  subtitle: 'Private, ad-free video hosting for friends and family.',
  ctaLabel: 'Explore Sample Channel'
}
</script>
