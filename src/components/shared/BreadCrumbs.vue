<template>
  <nav class="breadcrumb-nav">
    <div class="row items-center q-gutter-md q-pa-md">
      <q-avatar v-if="$q.screen.gt.xs">
        <img :src="channel.cover" :alt="channel.title" loading="lazy" decoding="async" />
      </q-avatar>
      <div class="col">
        <q-breadcrumbs :active-color="$q.dark.isActive ? 'info' : 'primary'">
          <template #separator>
            <q-icon
              size="1.5em"
              name="chevron_right"
              :color="$q.dark.isActive ? 'info' : 'primary'" />
          </template>
          <q-breadcrumbs-el
            v-for="location in breadcrumbs"
            :class="$q.screen.gt.xs ? 'text-h5' : 'text-h6'"
            :key="location.id"
            :label="location.label"
            :to="location.to" />
        </q-breadcrumbs>
        <div class="text-caption">By {{ channel.ownername }}</div>
      </div>
    </div>
  </nav>
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
