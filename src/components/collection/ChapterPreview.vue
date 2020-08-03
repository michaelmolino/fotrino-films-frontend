<template>
    <q-btn
      flat
      dense
      no-caps
      padding="8px"
      :class="chapter.primary ? 'fit bg-accent' : 'fit'"
    >
      <q-badge
        v-if="chapter.type.startsWith('audio/')"
        class="bg-accent q-pa-md z-top"
        floating
        transparent
      >
        <span class="text-bold">Audio</span>
      </q-badge>
      <q-img :src="chapter.previewUrl" :ratio="16 / 9" loading="lazy">
        <div class="absolute-bottom text-center">
          <div class="ellipsis">{{ chapter.title }}</div>
        </div>
        <template v-slot:error>
          <div class="absolute-bottom text-center bg-dark">
            <div class="ellipsis">{{ chapter.title }}</div>
          </div>
        </template>
      </q-img>
    </q-btn>
</template>

<script>
export default {
  name: 'ChapterPreview',

  props: {
    chapter: Object
  }
}
</script>
