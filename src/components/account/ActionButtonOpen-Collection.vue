<template>
  <q-btn
    round
    dense
    color="info"
    icon="link"
    :to="'/' + collection.uuid + '/' + collection.slug"
    target="_blank"
  >
    <q-tooltip>Open Collection</q-tooltip>
  </q-btn>
</template>

<script>
export default {
  name: 'ActionButtonOpen-Collection',

  props: {
    collection: Object
  }
}
</script>
