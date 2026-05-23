<template>
  <q-btn-toggle
    :model-value="model"
    @update:model-value="updateModelValue"
    class="channel-view-toggle-control"
    data-cy="channel-view-toggle"
    no-caps
    rounded
    unelevated
    toggle-color="primary"
    color="white"
    text-color="primary"
    :options="[
      { value: 'albums', slot: 'album' },
      { value: 'all', slot: 'all' }
    ]">
    <template #album>
      <div class="row items-center no-wrap" data-cy="channel-view-albums">
        <span class="text-center">Albums</span>
        <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{
          albumCount
        }}</q-avatar>
      </div>
    </template>
    <template #all>
      <div class="row items-center no-wrap" data-cy="channel-view-all">
        <span class="text-center">All Videos</span>
        <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{
          allCount
        }}</q-avatar>
      </div>
    </template>
  </q-btn-toggle>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: 'all' },
  albumCount: Number,
  allCount: Number
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

function updateModelValue(val) {
  model.value = val
}
</script>

<style scoped>
.channel-view-toggle-control {
  padding-top: 12px;
  padding-bottom: 12px;
}

@media (max-width: 599px) {
  .channel-view-toggle-control {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .channel-view-toggle-control :deep(.q-btn) {
    min-height: 30px;
    padding: 4px 8px;
  }

  .channel-view-toggle-control :deep(.q-btn__content) {
    font-size: 12px;
    gap: 4px;
  }

  .channel-view-toggle-control :deep(.q-avatar) {
    width: 18px;
    height: 18px;
    min-width: 18px;
    min-height: 18px;
    font-size: 11px;
  }
}
</style>
