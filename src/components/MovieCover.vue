<template>
  <q-img class="q-ma-xs" :src="coverUrl" :ratio="2 / 3">
    <div class="absolute-bottom text-center text-subtitle1">
      {{ title }}<br />
      {{ subTitle }}
    </div>
    <template v-slot:error>
      <div class="absolute-full flex flex-center bg-dark text-subtitle1">
        {{ title }}<br />
        {{ subTitle }}
      </div>
    </template>
  </q-img>
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
