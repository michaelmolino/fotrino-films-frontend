<template>
  <div>
    <q-input
      v-if="showSubtitle"
      outlined
      clearable
      :color="inputColor"
      class="q-pb-md"
      :model-value="subtitle"
      :label="subtitleLabel"
      :data-cy="subtitleDataCy"
      @update:model-value="onUpdateSubtitle" />

    <div class="text-overline q-mb-md">Album Poster</div>
    <div class="row items-center q-gutter-sm">
      <q-radio
        v-if="showPosterType"
        :model-value="posterType"
        val="default"
        label="Solid Colour"
        :data-cy="posterTypeDefaultDataCy"
        color="accent"
        @update:model-value="onUpdatePosterType" />
      <q-btn
        v-if="showPosterType && posterType === 'default'"
        flat
        dense
        no-caps
        padding="0px"
        color="accent"
        label="Change Colour"
        :data-cy="posterColorButtonDataCy"
        @click="colorDialog = true" />
    </div>

    <q-radio
      v-if="showPosterType"
      :model-value="posterType"
      val="new"
      label="Upload Photo"
      :data-cy="posterTypeNewDataCy"
      color="accent"
      @update:model-value="onUpdatePosterType" />

    <q-file
      v-if="posterType === 'new'"
      label="Album Poster (Image)"
      outlined
      :model-value="posterFile"
      accept="image/*"
      class="q-py-md"
      color="accent"
      :data-cy="posterFileDataCy"
      @update:model-value="onUpdatePosterFile">
      <template v-slot:prepend>
        <q-icon name="image" @click.stop.prevent />
      </template>
      <template v-slot:append>
        <q-icon
          name="close"
          @click.stop.prevent="clearPosterFile"
          class="cursor-pointer" />
      </template>
    </q-file>

    <div class="width250" :data-cy="posterPreviewDataCy">
      <AlbumPoster v-if="albumPreview" :album="albumPreview" />
      <q-skeleton
        v-else
        class="cursor-not-allowed"
        style="width: 250px; height: 375px"
        animation="none" />
    </div>

    <q-dialog v-model="colorDialog">
      <q-card style="min-width: 300px">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle1">Choose Poster Colour</div>
        </q-card-section>
        <q-card-section>
          <q-color
            class="q-mt-sm"
            :model-value="posterColor || defaultColor"
            @update:model-value="onUpdatePosterColor"
            format="hex"
            default-view="palette" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="colorDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AlbumPoster from '@components/channel/shared/AlbumPoster.vue'

defineProps({
  subtitle: {
    type: String,
    default: null
  },
  subtitleLabel: {
    type: String,
    default: 'Album SubTitle'
  },
  inputColor: {
    type: String,
    default: undefined
  },
  showSubtitle: {
    type: Boolean,
    default: true
  },
  showPosterType: {
    type: Boolean,
    default: true
  },
  posterType: {
    type: String,
    default: 'default'
  },
  posterColor: {
    type: String,
    default: '#000000'
  },
  posterFile: {
    type: [File, Array, null],
    default: null
  },
  albumPreview: {
    type: Object,
    default: null
  },
  subtitleDataCy: {
    type: String,
    default: 'album-subtitle-input'
  },
  posterTypeDefaultDataCy: {
    type: String,
    default: 'album-poster-type-default'
  },
  posterTypeNewDataCy: {
    type: String,
    default: 'album-poster-type-new'
  },
  posterFileDataCy: {
    type: String,
    default: 'album-poster-file'
  },
  posterColorButtonDataCy: {
    type: String,
    default: 'album-poster-color'
  },
  posterPreviewDataCy: {
    type: String,
    default: 'album-poster-preview'
  }
})

const emit = defineEmits([
  'update:subtitle',
  'update:posterType',
  'update:posterColor',
  'update:posterFile'
])

const defaultColor = '#000000'
const colorDialog = ref(false)

function onUpdatePosterColor(val) {
  let color = defaultColor
  if (typeof val === 'string') {
    color = val.startsWith('#') ? val : `#${val}`
  } else if (val && typeof val === 'object') {
    const hex = val.hex || ''
    if (hex) {
      color = hex.startsWith('#') ? hex : `#${hex}`
    } else {
      color = defaultColor
    }
  }
  emit('update:posterColor', color)
}

function onUpdateSubtitle(value) {
  emit('update:subtitle', value)
}

function onUpdatePosterType(value) {
  emit('update:posterType', value)
}

function onUpdatePosterFile(value) {
  emit('update:posterFile', value)
}

function clearPosterFile() {
  emit('update:posterFile', null)
}
</script>

<style scoped>
@media (max-width: 959px) {
  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 16px;
  }
}
</style>
