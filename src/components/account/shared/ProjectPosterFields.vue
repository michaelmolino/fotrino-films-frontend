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
      @update:model-value="$emit('update:subtitle', $event)" />

    <div class="text-overline q-mb-md">Project Poster</div>
    <div class="row items-center q-gutter-sm">
      <q-radio
        v-if="showPosterType"
        :model-value="posterType"
        val="default"
        label="Solid Colour"
        :data-cy="posterTypeDefaultDataCy"
        color="accent"
        @update:model-value="$emit('update:posterType', $event)" />
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
      @update:model-value="$emit('update:posterType', $event)" />

    <q-file
      v-if="posterType === 'new'"
      label="Project Poster (Image)"
      outlined
      :model-value="posterFile"
      accept="image/*"
      class="q-py-md"
      color="accent"
      :data-cy="posterFileDataCy"
      @update:model-value="$emit('update:posterFile', $event)">
      <template v-slot:prepend>
        <q-icon name="image" @click.stop.prevent />
      </template>
      <template v-slot:append>
        <q-icon
          name="close"
          @click.stop.prevent="$emit('update:posterFile', null)"
          class="cursor-pointer" />
      </template>
    </q-file>

    <div class="width250" :data-cy="posterPreviewDataCy">
      <ProjectPoster v-if="projectPreview" :project="projectPreview" />
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
import ProjectPoster from '@components/channel/ProjectPoster.vue'

defineProps({
  subtitle: {
    type: String,
    default: null
  },
  subtitleLabel: {
    type: String,
    default: 'Project SubTitle'
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
  projectPreview: {
    type: Object,
    default: null
  },
  subtitleDataCy: {
    type: String,
    default: 'project-subtitle-input'
  },
  posterTypeDefaultDataCy: {
    type: String,
    default: 'project-poster-type-default'
  },
  posterTypeNewDataCy: {
    type: String,
    default: 'project-poster-type-new'
  },
  posterFileDataCy: {
    type: String,
    default: 'project-poster-file'
  },
  posterColorButtonDataCy: {
    type: String,
    default: 'project-poster-color'
  },
  posterPreviewDataCy: {
    type: String,
    default: 'project-poster-preview'
  }
})

const emit = defineEmits(['update:subtitle', 'update:posterType', 'update:posterColor', 'update:posterFile'])

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
</script>
