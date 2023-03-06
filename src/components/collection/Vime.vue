<template>
    <div v-if="!chapter.type.startsWith('audio/')">
        <media-player aspect-ratio="16/9" controls :src="chapter.src" :poster="chapter.preview" view="video" :key="chapter.id" style="width: 100%; height: 100%">
          <media-outlet></media-outlet>
        </media-player>
    </div>
    <div v-else>
        <media-player aspect-ratio="16/9" controls :src="chapter.src" :poster="chapter.preview" view="audio" :key="chapter.id" style="width: 100%; height: 100%">
          <media-poster></media-poster>
          <media-outlet class="q-pt-sm"></media-outlet>
        </media-player>
    </div>
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
  setup() {
    defineCustomElements()
  }
}
</script>
