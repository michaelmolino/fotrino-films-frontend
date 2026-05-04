<template>
  <div>
    <q-input
      v-if="showDescription"
      :model-value="description"
      outlined
      autogrow
      clearable
      :color="inputColor"
      class="q-pb-md"
      label="Description - p, br, strong, and i tags allowed"
      data-cy="media-description-input"
      @update:model-value="$emit('update:description', $event)" />

    <div v-if="showExtendedAttributes">
      <div class="text-overline">Extended Attributes</div>
      <q-btn
        icon="event"
        flat
        class="q-mt-xs"
        :label="resourceDateLabel">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="resourceDate"
            mask="YYYY-MM-DD"
            subtitle="Capture Date"
            :options="dateOptionsFn"
            @update:model-value="$emit('update:resourceDate', $event)">
            <div class="row items-center justify-end q-gutter-sm">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn label="OK" flat v-close-popup />
            </div>
          </q-date>
        </q-popup-proxy>
        <q-tooltip>Capture Date</q-tooltip>
      </q-btn>

      <div>
        <q-checkbox
          :model-value="main"
          outlined
          label="Featured"
          class="q-pr-lg q-pl-sm"
          data-cy="media-featured-checkbox"
          @update:model-value="$emit('update:main', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  description: {
    type: String,
    default: null
  },
  resourceDate: {
    type: String,
    default: null
  },
  main: {
    type: Boolean,
    default: false
  },
  inputColor: {
    type: String,
    default: undefined
  },
  showDescription: {
    type: Boolean,
    default: true
  },
  showExtendedAttributes: {
    type: Boolean,
    default: true
  }
})

defineEmits(['update:description', 'update:resourceDate', 'update:main'])

const resourceDateLabel = computed(() => {
  if (!props.resourceDate) {
    return 'Set Capture Date'
  }
  const date = parseResourceDate(props.resourceDate)
  return Number.isNaN(date.getTime()) ? props.resourceDate : date.toLocaleDateString()
})

function dateOptionsFn(date) {
  return parseResourceDate(date) <= new Date()
}

function parseResourceDate(value) {
  if (!value || typeof value !== 'string') {
    return new Date('invalid')
  }

  const [year, month, day] = value.replaceAll('/', '-').split('-').map((part) => Number.parseInt(part, 10))
  if (!year || !month || !day) {
    return new Date('invalid')
  }

  // Construct local date explicitly to avoid browser-specific string parsing differences.
  return new Date(year, month - 1, day)
}
</script>
