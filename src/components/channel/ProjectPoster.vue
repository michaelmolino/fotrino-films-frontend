<template>
  <q-btn flat dense no-caps class="fit" padding="16px">
    <q-badge class="bg-accent q-pa-md z-top" floating transparent>
      <span class="text-bold">{{ project.media.length }}</span>
    </q-badge>
    <q-img :src="project.poster" :ratio="2 / 3" fit="cover">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ project.title }}</div>
        <div class="ellipsis">{{ project.subtitle }}</div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis">{{ project.title }}</div>
          <div class="ellipsis">{{ project.subtitle }}</div>
        </div>
      </template>
    </q-img>
  </q-btn>
</template>

<script>
export default {
  name: 'ProjectPoster',

  props: {
    project: Object
  }
}
</script>
