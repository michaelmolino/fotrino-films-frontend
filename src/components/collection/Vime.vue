<template>
    <div v-if="!chapter.type.startsWith('audio/')" style="max-width: 640px">
        <vds-media>
            <vds-hls controls :poster="chapter.preview" :key="chapter.id">
                <video controls :src="chapter.src" preload="none"></video>
            </vds-hls>
        </vds-media>
    </div>
    <div v-else style="max-width: 640px">
        <vds-media style="width: 100%">
            <vds-poster></vds-poster>
            <vds-audio controls :poster="chapter.preview" style="width: 100%" class="q-pt-sm">
                <audio controls :src="chapter.src" preload="none" style="width: 100%"></audio>
            </vds-audio>
        </vds-media>
    </div>
  </template>

<script>
import '@vidstack/player/define/vds-media.js'
import '@vidstack/player/define/vds-hls.js'
import '@vidstack/player/define/vds-audio.js'
import '@vidstack/player/define/vds-poster.js'

export default {
  name: 'VimePlayer',
  props: {
    chapter: Object
  }
}
</script>
