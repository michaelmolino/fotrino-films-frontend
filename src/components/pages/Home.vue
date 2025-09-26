<template>
  <div class="q-pa-md absolute-center">
      <section class="text-right">
        <transition
          appear
          enter-active-class="animated zoomInDown slower"
        >
          <div>
            <h1 class="text-h4 q-my-none">
              <span :class="darkClass">Fotrino </span>
              <span class="text-accent">Films</span>
            </h1>
            <h2 class="text-h4 q-my-none">
              <span :class="darkClass">The </span>
              <span class="text-accent">Transparent </span>
              <span :class="darkClass">Video Host</span>
            </h2>
          </div>
        </transition>
        <div class="text-caption text-center q-py-md">
          <q-btn flat to="/9944fa03-8a73-4e52-84bc-e8a514bd1271/Sample-Channel" align="left" no-wrap>
            <q-avatar icon="far fa-circle-play" />
            <span class="q-pl-md ellipsis">Sample Channel</span>
          </q-btn>
        </div>
      </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

defineOptions({ name: 'Home-Page' })
const $q = useQuasar()
const darkClass = computed(() => ($q.dark.isActive ? 'text-white' : 'text-secondary'))
</script>
