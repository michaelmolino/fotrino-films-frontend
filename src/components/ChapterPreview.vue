<template>
  <div :class="primary ? 'bg-accent' : ''">
    <q-btn
      flat
      dense
      no-caps
      :to="'/' + userUuid + '/' + 'movies' + '/' + movieId + '/' + chapterId"
      class="fit"
      padding="8px"
    >
      <q-badge
        v-if="type.startsWith('audio/')"
        style="z-index: 999 !important"
        class="bg-accent q-pa-md"
        align="middle"
        floating
        transparent
      >
        <span class="text-bold">MP3</span>
      </q-badge>
      <q-img :img-style="(!previewUrl && $q.dark.isActive) ? { filter: 'invert(1)' } : ''" class="q-ma-xs" :src="previewUrl || defaultPreview" :ratio="16 / 9">
        <div class="absolute-bottom text-subtitle1 text-center">
          {{ title }}
        </div>
        <template v-slot:error>
          <div class="absolute-full flex flex-center bg-dark text-white">
            {{ title }}
          </div>
        </template>
      </q-img>
    </q-btn>
  </div>
</template>

<script>
export default {
  name: 'ChapterPreview',
  data () {
    return {
      defaultPreview: 'https://media-us.fotrino.com/placeholder-image.png'
    }
  },
  props: {
    title: String,
    previewUrl: String,
    primary: Boolean,
    userUuid: String,
    movieId: Number,
    chapterId: Number,
    type: String
  }
}
</script>
