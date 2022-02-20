<template>
  <q-btn
    round
    dense
    color="info"
    icon="link"
    :to="'/' + collection.uuid + '/' + collection.slug + '/' + movie.slug"
  >
    <q-tooltip>Open Movie</q-tooltip>
  </q-btn>
</template>

<script>
export default {
  name: 'ActionButtonOpen-Movie',

  props: {
    collection: Object,
    movie: Object
  }
}
</script>
