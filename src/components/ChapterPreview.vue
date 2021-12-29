<template>
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
</template>

<script>
export default {
  name: 'ChapterPreview',
  props: {
    id: Number,
    title: String,
    previewUrl: String
  }
}
</script>
