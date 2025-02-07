<template>
  <q-btn
    flat
    dense
    no-caps
    padding="8px"
    :class="media.main ? 'fit bg-accent' : 'fit'"
    style="max-width: 640px"
  >
    <q-badge
      v-if="media.type.startsWith('audio/')"
      class="bg-accent q-pa-md z-top"
      floating
      transparent
    >
      <span class="text-bold">Audio</span>
    </q-badge>
    <q-img :src="media.preview" :ratio="16 / 9">
      <div class="absolute-bottom text-center">
        <div class="ellipsis"><span>{{ media.title }}</span><span v-if="detail && media.title !== project.title"><br>{{ project.title }}</span></div>
      </div>
      <template v-slot:error>
        <div class="absolute-full bg-black text-center text-h6">
          <div class="absolute-center">
            <q-spinner-gears color="accent" size="xl" />
          </div>
        </div>
        <div class="absolute-bottom text-center">
          <div class="ellipsis"><span>{{ media.title }}</span><span v-if="detail && media.title !== project.title"><br>{{ project.title }}</span></div>
        </div>
      </template>
    </q-img>
  </q-btn>
</template>

<script>
export default {
  name: 'MediaPreview',

  props: {
    media: Object,
    project: Object,
    detail: Boolean
  }
}
</script>
