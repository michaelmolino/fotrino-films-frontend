<template>
  <div v-if="!type.startsWith('audio/')">
    <video ref="videoPlayer" class="video-js vjs-theme-city"></video>
  </div>
  <div v-else>
    <audio ref="videoPlayer" class="video-js vjs-theme-city"></audio>
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
  data() {
    return {
      player: null
    }
  },
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options)
  },
  beforeUnmount() {
    this.player?.dispose()
  }
}
</script>

<style src="@deps/video.js/dist/video-js.min.css"></style>
<style src="@deps/@videojs/themes/dist/city/index.css"></style>
