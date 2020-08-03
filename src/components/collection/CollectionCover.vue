<template>
  <q-btn flat dense no-caps class="fit" padding="16px">
    <q-img
      :src="collection.coverUrl"
      :ratio="1 / 1"
      loading="lazy"
    />
    {{ collection.title }}
  </q-btn>
</template>

<script>
export default {
  name: 'CollectionCover',

  props: {
    collection: Object
  }
}
</script>
