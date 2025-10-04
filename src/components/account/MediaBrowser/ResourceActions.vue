<template>
  <div class="header-content">
    <q-item-section avatar>
      <q-avatar :square="square">
        <template v-if="image">
          <q-img :src="image" class="cover" />
        </template>
        <template v-else>
          <div class="cover avatar-fill" :style="{ backgroundColor: color || '#000000' }" />
        </template>
      </q-avatar>
    </q-item-section>

    <q-item-section class="text-no-wrap ellipsis fit-to-width">
      {{ title }}
    </q-item-section>

    <q-item-section class="header-buttons">
      <div class="text-no-wrap">
        <q-btn v-if="pending" dense unelevated icon="fas fa-clock" class="cursor-not-allowed">
          <q-tooltip>Pending</q-tooltip>
        </q-btn>

        <q-btn v-else :to="link" dense unelevated icon="link" color="info" class="q-mx-xs">
          <q-tooltip>Link</q-tooltip>
        </q-btn>

        <q-btn
          v-if="!pending"
          dense
          unelevated
          icon="delete"
          :color="deleteColor"
          class="q-ml-xs"
          @click="$emit('delete')">
          <q-tooltip>Delete</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </div>
</template>

<script setup>
defineOptions({ name: 'ResourceHeader' })

defineProps({
  title: String,
  image: String,
  color: String,
  pending: Boolean,
  link: String,
  square: Boolean,
  deleteColor: {
    type: String,
    default: 'negative'
  }
})

defineEmits(['delete'])
</script>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.fit-to-width {
  min-width: 0;
  display: inline-block;
}
.cover {
  object-fit: cover;
}
.avatar-fill {
  width: 100%;
  height: 100%;
}
</style>
