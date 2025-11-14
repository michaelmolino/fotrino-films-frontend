<template>
  <div class="header-content">
    <q-item-section avatar>
      <div class="relative-position" style="display: flex; align-items: center; gap: 8px">
        <q-avatar :square="square" :size="avatarSize">
          <template v-if="image">
            <q-img :src="image" class="cover" />
          </template>
          <template v-else>
            <div class="cover avatar-fill" :style="{ backgroundColor: color || '#000000' }" />
          </template>
        </q-avatar>
        <q-badge v-if="badge" floating color="accent" text-color="white" class="admin-badge">
          <q-icon :name="badgeIcon" size="12px" />
        </q-badge>
        <span class="action-btns-inline">
          <q-btn
            v-if="!pending && !deleted && link"
            flat
            dense
            size="sm"
            icon="link"
            color="primary"
            class="q-ml-xs"
            :to="link"
            :title="`Visit ${title}`"
            :aria-label="`Visit ${title}`">
            <q-tooltip>Visit</q-tooltip>
          </q-btn>
          <q-btn
            v-if="!pending && deleted"
            flat
            dense
            size="sm"
            icon="delete"
            color="grey-6"
            class="q-ml-xs"
            disable
            title="Resource pending deletion.">
            <q-tooltip>Resource pending deletion.</q-tooltip>
          </q-btn>
          <q-btn
            v-if="pending"
            flat
            dense
            size="sm"
            icon="schedule"
            color="grey-6"
            class="q-ml-xs cursor-not-allowed"
            data-cy="media-pending"
            :aria-label="'Pending ' + title">
            <q-tooltip>Pending</q-tooltip>
          </q-btn>
          <q-btn
            v-if="!pending && false"
            flat
            dense
            size="sm"
            icon="edit"
            color="accent"
            class="q-ml-xs"
            @click="showEditNotification">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn
            v-if="!pending && !deleted"
            flat
            dense
            size="sm"
            icon="delete"
            :aria-label="'Delete ' + title"
            :color="deleteColor"
            :disable="!canDelete"
            class="q-ml-xs"
            data-cy="delete-media"
            @click="$emit('delete')">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </span>
      </div>
    </q-item-section>

    <q-item-section class="text-no-wrap ellipsis fit-to-width">
      <div class="title-row">
        <span class="text-weight-medium">{{ title }}</span>
      </div>
      <div v-if="subtitle" class="text-grey-6 text-caption q-mt-xs">{{ subtitle }}</div>
    </q-item-section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Notify } from 'quasar'

const props = defineProps({
  title: String,
  image: String,
  color: String,
  pending: Boolean,
  deleted: Boolean,
  hasPendingChildren: Boolean,
  link: String,
  square: Boolean,
  deleteColor: {
    type: String,
    default: 'negative'
  },
  badge: Boolean,
  badgeIcon: String,
  subtitle: String,
  avatarSize: {
    type: String,
    default: '48px'
  }
})

defineEmits(['delete'])
const canDelete = computed(() => !props.pending && !props.hasPendingChildren)

function showEditNotification() {
  Notify.create({
    type: 'info',
    message: 'Edit functionality is not yet implemented.',
    icon: 'info',
    position: 'bottom',
    timeout: 3000
  })
}
</script>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.action-btns-inline {
  display: flex;
  align-items: center;
  gap: 4px;
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
.admin-badge {
  z-index: 1;
}
</style>
