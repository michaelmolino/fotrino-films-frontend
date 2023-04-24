<template>
  <div>
    <media-player controls :src="chapter.src" :poster="chapter.preview" :view="view" :key="chapter.id">
      <media-poster v-if="view === 'audio'"></media-poster>
      <media-outlet class="q-pt-sm"></media-outlet>
    </media-player>
  </div>
</template>

<script>
import { defineCustomElements } from 'vidstack/elements'
import 'vidstack/styles/defaults.css'

export default {
  name: 'VidstackPlayer',
  props: {
    chapter: Object
  },
  computed: {
    view: {
      get() {
        return this.chapter.type.startsWith('audio/') ? 'audio' : 'video'
      }
    }
  },
  setup() {
    defineCustomElements()
  }
}
</script>

<style>
:root {
  --plyr-color-main: #8D6A9F;
}
</style>
