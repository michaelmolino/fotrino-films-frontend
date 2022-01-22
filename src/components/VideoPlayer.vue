<template>
  <div v-if="!type.startsWith('audio/')">
    <video ref="videoPlayer" class="video-js vjs-theme-city"></video>
  </div>
  <div v-else>
    <audio id="audioPlayer" ref="videoPlayer" class="video-js vjs-theme-city"></audio>
  </div>
</template>

<script>
import videojs from 'video.js'

export default {
  name: 'VideoPlayer',
  props: {
    type: String,
    options: Object
  },
  data () {
    return {
      player: null
    }
  },
  mounted () {
    this.player = videojs(this.$refs.videoPlayer, this.options)
  },
  beforeUnmount () {
    if (this.player) {
      this.player.dispose()
    }
  }
}
</script>

<style src="video.js/dist/video-js.min.css"></style>
<style src="@videojs/themes/dist/city/index.css"></style>
