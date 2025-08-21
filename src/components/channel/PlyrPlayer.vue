<template>
    <div>
      <div v-if="view == 'video'">
        <video id="player" controls :key="media.id" class="videoEl" />
      </div>
      <div v-else>
        <q-img
          :src="media.preview"
          :ratio="16/9"
          fit="cover"
          class="full-width"
        />
        <audio id="player" controls :key="media.id" class="audioEl"></audio>
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
    media: Object,
    artist: String
  },
  data() {
    return {
      player: {},
      hls: {},
      playHandler: null
    }
  },
  computed: {
    view: {
      get() {
        return this.media.type && this.media.type.startsWith('audio/') ? 'audio' : 'video'
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
        const source = this.media.src
        if (Hls.isSupported()) {
          this.hls = new Hls()
          this.hls.loadSource(source)
          this.hls.attachMedia(video)
          window.hls = this.hls
        } else {
          video.src = source
        }
        this.player.poster = this.media.preview
      } else {
        const audio = document.querySelector('audio')
        audio.src = this.media.src
        audio.type = this.media.type
      }
    },
    attachMediaSessionHandler() {
      const el = document.getElementById('player')
      if (!('mediaSession' in navigator) || !el) return
      if (this.playHandler) {
        el.removeEventListener('play', this.playHandler)
      }
      this.playHandler = () => {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.media.title,
          artist: this.artist,
          artwork: [{
            src: this.media.preview,
            type: 'image/jpeg'
          }]
        })
      }
      el.addEventListener('play', this.playHandler, { once: true })
    }
  },
  mounted() {
    this.setSourceHack()
    this.attachMediaSessionHandler()
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
    this.attachMediaSessionHandler()
  }
}
</script>

<style>
:root {
  --plyr-color-main: #8D6A9F;
}
.videoEl {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.audioEl {
  width: 100%;
}
</style>
