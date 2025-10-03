<template>
  <q-btn
    flat
    dense
    no-caps
    padding="8px"
    :class="['fit', 'width720', { 'bg-accent': media.main && showMainAccent }]">
    <q-badge
      v-if="media.type?.startsWith('audio/')"
      class="bg-accent q-pa-md z-top"
      floating
      transparent>
      <span class="text-bold">Audio</span>
    </q-badge>
    <q-img v-if="media.preview" :src="media.preview" :ratio="16 / 9" fit="cover">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">
          <span>{{ media.title }}</span
          ><span v-if="detail && media.title !== project?.title"><br />{{ project?.title }}</span>
        </div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis">
            <span>{{ media.title }}</span
            ><span v-if="detail && media.title !== project?.title"><br />{{ project?.title }}</span>
          </div>
        </div>
      </template>
    </q-img>
    <q-skeleton
      v-if="!media.preview"
      class="cursor-not-allowed preview-skeleton"
      animation="none" />
  </q-btn>
</template>

<script setup>
const { media, project, detail, showMainAccent } = defineProps({
  media: Object,
  project: Object,
  detail: Boolean,
  showMainAccent: { type: Boolean, default: true }
})
</script>

<style scoped>
.preview-skeleton {
  width: 250px;
  height: 141px;
}
</style>
