<template>
  <q-btn flat dense no-caps class="fit" padding="16px">
    <q-badge class="bg-accent q-pa-md z-top" floating transparent>
      <span class="text-bold">{{ movie.chapters.length }}</span>
    </q-badge>
    <q-img :src="movie.poster" :ratio="2 / 3">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ movie.title }}</div>
        <div class="ellipsis">{{ movie.subtitle }}</div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis">{{ movie.title }}</div>
          <div class="ellipsis">{{ movie.subtitle }}</div>
        </div>
      </template>
    </q-img>
  </q-btn>
</template>

<script>
export default {
  name: 'MoviePoster',

  props: {
    movie: Object
  }
}
</script>
