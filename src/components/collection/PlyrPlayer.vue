<template>
    <div>
      <div v-if="view == 'video'">
        <video id="player" controls :data-poster="chapter.preview" :key="chapter.id" style="width: 100%; height: 100%; aspect-ratio: 16 / 9" />
      </div>
      <div v-else>
        <q-img
          :src="chapter.preview"
          style="width: 100%; height: 100%;"
          :ratio="16/9"
        />
        <audio id="player" controls :key="chapter.id" style="width: 100%; height: 100%;">
          <source :src="chapter.src" :type="chapter.type" />
        </audio>
      </div>
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

      if (this.view === 'video') {
        const video = document.querySelector('video')
        const source = this.chapter.src
        if (Hls.isSupported()) {
          this.hls = new Hls()
          this.hls.loadSource(source)
          this.hls.attachMedia(video)
          window.hls = this.hls
        } else {
          video.src = source
        }
        this.player.poster = this.chapter.preview
      } else {
        const audio = document.querySelector('audio')
        audio.src = this.chapter.src
      }
    }
  },
  mounted() {
    this.setSourceHack()
  },
  beforeUnmount() {
    try {
      this.player.destroy()
    } catch (e) {
      //
    }
  },
  updated() {
    if (Hls.isSupported()) {
      try {
        this.hls.destroy()
      } catch (e) {
        //
      }
    }
    try {
      this.player.destroy()
    } catch (e) {
      //
    }
    this.setSourceHack()
  }
}
</script>

<style>
:root {
  --plyr-color-main: #8D6A9F;
}
</style>
