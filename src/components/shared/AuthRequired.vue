<template>
  <div class="auth-required-container">
    <q-icon :name="computedIcon" :size="iconSize" color="grey-5" />
    <div class="text-h6 q-mt-md text-grey-6">{{ computedTitle }}</div>
    <div class="text-body2 text-grey-7">{{ computedMessage }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'login',
    validator: value => ['login', 'admin', 'custom'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconSize: {
    type: String,
    default: '48px'
  }
})

const computedTitle = computed(() => {
  if (props.title) return props.title
  switch (props.type) {
    case 'admin':
      return 'Access Denied'
    case 'login':
    default:
      return 'Authentication Required'
  }
})

const computedMessage = computed(() => {
  if (props.message) return props.message
  switch (props.type) {
    case 'admin':
      return "You don't have administrator privileges."
    case 'login':
    default:
      return 'Please log in to access this page.'
  }
})

const computedIcon = computed(() => {
  if (props.icon) return props.icon
  switch (props.type) {
    case 'admin':
      return 'security'
    case 'login':
    default:
      return 'lock'
  }
})
</script>

<style scoped>
.auth-required-container {
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
