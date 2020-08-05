<template>
  <!-- <div class="fit"> -->
  <!-- <q-flashcard> -->
  <!-- <q-flashcard-section transition="nudge-in" class="fit"> -->
  <q-img class="q-ma-xs" :src="coverUrl" :ratio="3 / 4">
    <div class="absolute-bottom text-subtitle1 text-center">
      {{ title }}<br />
      {{ subTitle }}
    </div>
    <template v-slot:error>
      <div class="absolute-full flex flex-center bg-dark text-white">
        <h6>{{ title }}</h6>
      </div>
    </template>
  </q-img>
  <!-- </q-flashcard-section> -->
  <!-- </q-flashcard> -->
  <!-- </div> -->
</template>

<script>
export default {
  name: 'MovieCover',
  props: {
    title: String,
    subTitle: String,
    coverUrl: String
  }
}
</script>
