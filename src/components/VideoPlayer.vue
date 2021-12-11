<template>
  <div>
    <video ref="videoPlayer" class="video-js vjs-theme-fantasy"></video>
  </div>
</template>

<script>
import videojs from 'video.js'

export default {
  name: 'VideoPlayer',
  props: {
    options: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  data () {
    return {
      player: null
    }
  },
  mounted () {
    this.player = videojs(
      this.$refs.videoPlayer,
      this.options,
      function onPlayerReady () {
        console.log('onPlayerReady', this)
      }
    )
  },
  beforeDestroy () {
    if (this.player) {
      this.player.dispose()
    }
  }
}
</script>

<style>
@import 'https://unpkg.com/video.js@7/dist/video-js.min.css';
@import 'https://unpkg.com/@videojs/themes@1/dist/fantasy/index.css';
</style>
