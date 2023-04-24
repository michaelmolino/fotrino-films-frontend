<template>
  <media-player aspect-ratio="16/9" controls :src="chapter.src" :poster="chapter.preview" :view="view" :key="chapter.id" style="width: 100%; height: 100%">
    <media-poster v-if="view === 'audio'"></media-poster>
    <media-outlet class="q-pt-sm"></media-outlet>
  </media-player>
</template>

<script>
import { defineCustomElements } from 'vidstack/elements'

import 'vidstack/styles/base.css'
import 'vidstack/styles/ui/buttons.css'
import 'vidstack/styles/ui/sliders.css'

export default {
  name: 'VimePlayer',
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
