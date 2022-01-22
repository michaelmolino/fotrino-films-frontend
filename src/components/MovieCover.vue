<template>
  <q-btn
    flat
    dense
    no-caps
    :to="'/' + userUuid + '/movies/' + movie.id"
    class="fit"
    padding="16px"
  >
    <q-badge
      style="z-index: 999 !important"
      class="bg-accent q-pa-md"
      align="middle"
      floating
      transparent
    >
      <span class="text-bold">{{ movie.chapters.length }}</span>
    </q-badge>
    <q-img class="q-ma-xs" :src="movie.coverUrl" :ratio="2 / 3">
      <div class="absolute-bottom text-center text-subtitle1">
        {{ movie.title }}<br />
        {{ movie.subTitle }}
      </div>
      <template v-slot:error>
        <div class="absolute-full flex flex-center bg-dark text-subtitle1">
          {{ movie.title }}<br />
          {{ movie.subTitle }}
        </div>
      </template>
    </q-img>
  </q-btn>
</template>

<script>
export default {
  name: 'MovieCover',
  props: {
    movie: Object,
    userUuid: String
  }
}
</script>
