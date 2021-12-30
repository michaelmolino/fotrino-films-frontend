<template>
  <div>
    <video ref="videoPlayer" class="video-js vjs-theme-city"></video>
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
    this.player = videojs(this.$refs.videoPlayer, this.options)
  },
  beforeDestroy () {
    if (this.player) {
      this.player.dispose()
    }
  }
}
</script>

<style src="video.js/dist/video-js.min.css"></style>
<style src="@videojs/themes/dist/city/index.css"></style>
