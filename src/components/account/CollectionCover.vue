<template>
  <q-btn flat dense no-caps class="fit" padding="16px">
    <q-img :src="collection.cover" :ratio="1 / 1">
      <div class="absolute-bottom text-center">
        <div class="ellipsis">{{ collection.title }}</div>
      </div>
      <template v-slot:error>
        <div class="absolute-bottom text-center bg-dark">
          <div class="ellipsis">{{ collection.title }}</div>
        </div>
      </template>
    </q-img>
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
