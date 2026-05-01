<template>
  <div>
    <!-- Title Field -->
    <q-input
      :model-value="title"
      outlined
      clearable
      label="Channel Title"
      class="q-pb-md"
      :data-cy="titleDataCy"
      @update:model-value="$emit('update:title', $event)" />

    <!-- Cover Section -->
    <div class="text-overline q-mb-md">Channel Cover</div>

    <!-- Cover File Input -->
    <q-file
      :model-value="coverFile"
      outlined
      label="Channel Cover (Image)"
      accept="image/*"
      class="q-pb-md"
      :data-cy="coverFileDataCy"
      @update:model-value="$emit('update:coverFile', $event)">
      <template v-slot:prepend>
        <q-icon name="image" @click.stop.prevent />
      </template>
      <template v-slot:append>
        <q-icon
          name="close"
          @click.stop.prevent="$emit('update:coverFile', null)"
          class="cursor-pointer" />
      </template>
    </q-file>

    <!-- Cover Preview -->
    <div v-if="coverPreview" class="q-mb-md">
      <img
        :src="coverPreview"
        alt="Channel Cover"
        class="rounded-borders"
        style="max-width: 100%; max-height: 200px; object-fit: cover"
        :data-cy="coverPreviewDataCy" />
    </div>
    <q-skeleton
      v-else
      type="rect"
      width="100%"
      height="200px"
      class="rounded-borders" />

    <!-- Processing Status -->
    <div v-if="coverProcessing" class="q-mt-md text-caption text-grey">
      Processing cover...
    </div>
  </div>
</template>

<script setup>

defineProps({
  title: {
    type: String,
    default: null
  },
  titleLabel: {
    type: String,
    default: 'Channel Title'
  },
  coverPreview: {
    type: String,
    default: null
  },
  coverFile: {
    type: [File, Array, null],
    default: null
  },
  coverProcessing: {
    type: Boolean,
    default: false
  },
  titleDataCy: {
    type: String,
    default: 'edit-channel-title'
  },
  coverFileDataCy: {
    type: String,
    default: 'edit-channel-cover-file'
  },
  coverPreviewDataCy: {
    type: String,
    default: 'edit-channel-cover-preview'
  }
})

defineEmits(['update:title', 'update:coverFile'])
</script>
