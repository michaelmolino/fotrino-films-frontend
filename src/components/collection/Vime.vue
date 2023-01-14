<template>
    <div v-if="!chapter.type.startsWith('audio/')">
        <vds-media style="width: 100%">
            <vds-aspect-ratio ratio="16/9">
                <vds-hls controls loading="idle" :poster="chapter.preview" :key="chapter.id">
                    <video controls :src="chapter.src" preload="none"></video>
                </vds-hls>
            </vds-aspect-ratio>
        </vds-media>
    </div>
    <div v-else>
        <vds-media>
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
import '@vidstack/player/define/vds-aspect-ratio.js'

export default {
  name: 'VimePlayer',
  props: {
    chapter: Object
  }
}
</script>
