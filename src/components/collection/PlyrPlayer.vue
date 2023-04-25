<template>
    <div>
      <video v-if="view == 'video'" id="player" controls :data-poster="chapter.preview" :key="chapter.id" />
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
      player: {},
      hls: {}
    }
  },
  computed: {
    view: {
      get() {
        return this.chapter.type.startsWith('audio/') ? 'audio' : 'video'
      }
    }
  },
  methods: {
    setSourceHack() {
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
      this.hls = new Hls()

      this.hls.loadSource(this.chapter.src)
      this.hls.attachMedia(document.querySelector('video'))
      window.hls = this.hls

      this.player.poster = this.chapter.preview
    }
  },
  mounted() {
    this.setSourceHack()
  },
  beforeUnmount() {
    this.player?.destroy()
    this.hls?.destroy()
  },
  updated() {
    this.player?.destroy()
    this.hls?.destroy()
    this.setSourceHack(this.player, this.hls)
  }
}
</script>

<style>
:root {
  --plyr-color-main: #8D6A9F;
}
</style>
