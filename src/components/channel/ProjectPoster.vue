<template>
  <q-btn flat dense no-caps class="fit" padding="16px">
    <q-badge class="bg-accent q-pa-md z-top" floating transparent>
      <span class="text-bold">{{ project.media.length }}</span>
    </q-badge>
    <q-img v-if="project.poster" :src="project.poster" :ratio="2 / 3" fit="cover">
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
    <q-skeleton
      v-if="!project.poster"
      class="cursor-not-allowed project-skeleton"
      animation="none"
    />
  </q-btn>
</template>

<script setup>
defineProps({
  project: Object
})
</script>

<style scoped>
.project-skeleton {
  width: 218px;
  height: 327px;
}
</style>
