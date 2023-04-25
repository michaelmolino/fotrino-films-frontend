<template>
    <div>
      <q-img
        v-if="view == 'audio'"
        :src="chapter.preview"
        style="width: 100%; max-width: 720px; min-width: 240px;"
      />
      <media-player controls :poster="chapter.preview" :view="view" load="eager" :key="chapter.id">
        <media-outlet class="q-pt-sm">
          <source :src="chapter.src" :type="chapter.type" />
        </media-outlet>
      </media-player>
    </div>
</template>

<script>
import Hls from 'hls.js'
import { defineCustomElements } from 'vidstack/elements'
import 'vidstack/styles/defaults.css'

export default {
  name: 'VidstackPlayer',
  props: {
    chapter: Object
  },
  computed: {
    view: {
      get() {
        return this.chapter.type.startsWith('audio/') ? 'audio' : 'video'
      }
    }
  },
  methods: {
    setProviderStlyingHack(player) {
      player.addEventListener('provider-setup', (event) => {
        const provider = event.detail
        if (provider?.type === 'hls') {
          provider.video.setAttribute('style', 'width: 100%; max-width: 720px; min-width: 240px;')
        }
        if (provider?.type === 'audio') {
          provider.audio.setAttribute('style', 'width: 100%; max-width: 720px; min-width: 240px;')
        }
      })
    }
  },
  mounted() {
    const player = document.querySelector('media-player')
    player.addEventListener('provider-change', (event) => {
      const provider = event.detail
      if (provider?.type === 'hls') {
        provider.library = Hls
      }
    })
    this.setProviderStlyingHack(player)
    defineCustomElements()
  },
  updated() {
    const player = document.querySelector('media-player')
    this.setProviderStlyingHack(player)
  }
}
</script>
