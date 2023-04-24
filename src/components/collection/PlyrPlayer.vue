<template>
    <div>
      <video v-if="view == 'video'" id="player" controls :data-poster="chapter.preview" :key="chapter.id"></video>
      <audio v-if="view == 'audio'" id="player" controls :key="chapter.id">
          <source :src="chapter.src" :type="chapter.type" />
      </audio>
    </div>
</template>

<script>
import Hls from 'hls.js'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

export default {
  name: 'PlyrPlayer',
  props: {
    chapter: Object
  },
  data() {
    return {
      player: {}
    }
  },
  computed: {
    view: {
      get() {
        return this.chapter.type.startsWith('audio/') ? 'audio' : 'video'
      }
    }
  },
  mounted() {
    this.player = new Plyr(document.getElementById('player'),
      {
        settings: [],
        controls: [
          'play-large',
          'restart',
          'rewind',
          'play',
          'fast-forward',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          // 'captions',
          // 'settings',
          // 'pip',
          'airplay',
          // 'download',
          'fullscreen'
        ]
      })

    const hls = new Hls()
    const source = this.chapter.src
    const video = document.querySelector('video')
    hls.loadSource(source)
    hls.attachMedia(video)
    window.hls = hls
  },
  beforeUnmount() {
    this.player?.destroy()
  }
}
</script>

<style>
:root {
  --plyr-color-main: #8D6A9F;
}
</style>
