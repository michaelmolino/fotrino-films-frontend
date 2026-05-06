<template>
  <q-btn-toggle
    :model-value="model"
    @update:model-value="updateModelValue"
    class="q-py-md"
    data-cy="channel-view-toggle"
    no-caps
    rounded
    unelevated
    toggle-color="primary"
    color="white"
    text-color="primary"
    :options="[
      { value: 'projects', slot: 'project' },
      { value: 'all', slot: 'all' }
    ]">
    <template #project>
      <div class="row items-center no-wrap" data-cy="channel-view-projects">
        <span class="text-center">Projects</span>
        <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{
          projectCount
        }}</q-avatar>
      </div>
    </template>
    <template #all>
      <div class="row items-center no-wrap" data-cy="channel-view-all">
        <span class="text-center">All Media</span>
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
  projectCount: Number,
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
