<template>
  <span>
    <q-img
      class="q-ma-xs cursor-pointer"
      :src="'images/' + shortName + '/Poster.jpg'"
      @click="dialog = true"
    >
      <div class="absolute-bottom text-subtitle1 text-center">
        {{ title }}<br />
        {{ subTitle }}
      </div>
    </q-img>

    <q-dialog
      v-model="dialog"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
      @before-hide="player = false"
      @before-show="beforeShow"
    >
      <q-card :class="'bg-' + color + ' text-black'">
        <q-bar>
          <q-space />
          <q-btn dense flat icon="arrow_back" v-if="player" @click="player = false">
            <q-tooltip content-class="bg-white text-primary">Back</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-card-section>
          <div class="row" v-if="!player">
            <div
              class="q-pa-sm col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
              v-for="movie in movies.movies"
              :key="movie.id"
            >
              <q-img :src="movie.thumb" class="fit cursor-pointer" :ratio="16/9" @click="player = movie.id">
                <div class="absolute-bottom text-subtitle1 text-center">
                  {{ movie.name }}
                </div>
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-dark text-white">
                    <h6>{{ movie.name }}</h6>
                  </div>
                </template>
              </q-img>
            </div>
          </div>
          <div v-else>
            <q-media-player
              dense
              autoplay
              :show-big-play-button="true"
              type="video"
              :sources="[{ src: movie.src, type: movie.type }]"
              big-play-button-color="black"
              :playback-rates="[{ label: 'Normal', value: 1 }]"
              style="max-width: 960px;"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </span>
</template>

<script>
export default {
  name: 'Movie',
  props: {
    shortName: String,
    title: String,
    subTitle: String,
    color: String,
    movies: Object
  },
  data () {
    return {
      dialog: false,
      player: false
    }
  },
  computed: {
    movie: {
      get () {
        return this.player ? this.movies.movies.find(m => m.id === this.player) : false
      }
    }
  },
  methods: {
    beforeShow () {
      if (this.movies.movies.length === 1) this.player = 1
    }
  }
}
</script>
