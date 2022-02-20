<template>
  <q-btn
    round
    dense
    color="info"
    icon="link"
    :to="
      '/' +
        collection.uuid +
        '/' +
        collection.slug +
        '/' +
        movie.slug +
        '/' +
        chapter.slug
    "
  >
    <q-tooltip>Open Chapter</q-tooltip>
  </q-btn>
</template>

<script>
export default {
  name: 'ActionButtonOpen-Chapter',

  props: {
    collection: Object,
    movie: Object,
    chapter: Object
  }
}
</script>
