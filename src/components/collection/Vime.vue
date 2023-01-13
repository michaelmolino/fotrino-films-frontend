<template>
    <div v-if="!chapter.type.startsWith('audio/')">
        <Player playsinline ref="player">
        <Hls :poster="chapter.preview">
          <source
            :src="chapter.src"
            :type="chapter.type"
          />
        </Hls>

        <DefaultUi>
          <!-- <TapSidesToSeek /> -->
        </DefaultUi>
      </Player>
    </div>
    <div v-else style="max-width: 640px">
        <Player playsinline ref="player">
        <q-img :src="chapter.preview" :ratio="16 / 9" />
        <Audio>
          <source
            :data-src="chapter.src"
            :type="chapter.type"
          />
        </Audio>

        <DefaultUi>
          <!-- <TapSidesToSeek /> -->
        </DefaultUi>
      </Player>
    </div>
  </template>

<script>
import { Player, Hls, Audio, DefaultUi } from '@vime/vue-next'

export default {
  name: 'VimePlayer',
  components: {
    Player,
    Hls,
    Audio,
    DefaultUi
  },
  props: {
    chapter: Object,
    options: Object
  },
  data() {
    return {
      player: null
    }
  },
  mounted() {
    // this.player = this.$refs.player
  },
  beforeUnmount() {
    // this.player?.dispose()
  }
}
</script>
