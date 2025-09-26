<template>
  <span>
    <q-item>
      <q-item-section side v-if="$q.screen.gt.xs">
        <q-avatar>
          <img :src="channel.cover" :alt="channel.title" />
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-breadcrumbs>
          <template #separator>
            <q-icon size="1.5em" name="fas fa-chevron-right" color="primary" />
          </template>
          <q-breadcrumbs-el
            v-for="location in breadcrumbs"
            :class="$q.screen.gt.xs ? 'text-h5' : 'text-h6'"
            :key="location.id"
            :label="location.label"
            :to="location.to"
          />
        </q-breadcrumbs>
        <q-item-label caption>By {{ channel.ownername }}</q-item-label>
      </q-item-section>
    </q-item>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  channel: Object,
  project: Object,
  media: Object,
  private: Boolean
})

const breadcrumbs = computed(() => {
  const arr = []
  if (!props.channel) return arr
  arr.push({
    id: 0,
    label: props.channel.title,
    to: `/${props.channel.uuid}/${props.channel.slug}`
  })
  if (props.project?.id) {
    arr.push({
      id: 1,
      label: props.project.title,
      to: `/${props.channel.uuid}/${props.channel.slug}/${props.project.slug}`
    })
  }
  if (props.project?.id && props.media?.id) {
    arr.push({
      id: 2,
      label: props.media.title,
      to: `/${props.channel.uuid}/${props.channel.slug}/${props.project.slug}/${props.media.slug}`
    })
  }
  // Last breadcrumb is not a link
  if (arr.length) arr[arr.length - 1].to = null
  // If private, only show last
  if (props.private) return arr.slice(-1)
  return arr
})
</script>
