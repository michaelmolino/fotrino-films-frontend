<template>
    <q-btn-toggle
        :model-value="modelValue"
        @update:model-value="updateModelValue"
        class="q-py-md"
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
            { value: 'projects', slot: 'project' },
            { value: 'main', slot: 'main' },
            { value: 'all', slot: 'all' }
        ]"
    >
        <template #project>
            <div class="row items-center no-wrap">
                <span class="text-center">Projects</span>
                <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{ projectCount }}</q-avatar>
            </div>
        </template>
        <template #main>
            <div class="row items-center no-wrap">
                <span class="text-center">Featured Media</span>
                <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{ mainCount }}</q-avatar>
            </div>
        </template>
        <template #all>
            <div class="row items-center no-wrap">
                <span class="text-center">All Media</span>
                <q-avatar color="accent" text-color="white" size="sm" square class="q-ml-sm">{{ allCount }}</q-avatar>
            </div>
        </template>
    </q-btn-toggle>
</template>

<script setup>
const { modelValue, projectCount, mainCount, allCount } = defineProps({
  modelValue: String,
  projectCount: Number,
  mainCount: Number,
  allCount: Number
})
const emit = defineEmits(['update:modelValue'])

function updateModelValue(val) {
  emit('update:modelValue', val)
}
</script>
