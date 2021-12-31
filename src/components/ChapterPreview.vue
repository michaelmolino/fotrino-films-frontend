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
      <q-img class="q-ma-xs" :src="previewUrl" :ratio="16 / 9">
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
  props: {
    title: String,
    previewUrl: String,
    primary: Boolean,
    userUuid: String,
    movieId: Number,
    chapterId: Number
  }
}
</script>
