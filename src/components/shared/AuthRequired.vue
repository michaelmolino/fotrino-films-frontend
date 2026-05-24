<template>
  <div class="auth-required-container" :data-cy="`auth-required-${props.type}`">
    <q-icon :name="resolved.icon" :size="iconSize" color="grey-5" />
    <div class="text-h6 q-mt-md text-grey-6" data-cy="auth-required-title">{{ resolved.title }}</div>
    <div class="text-body2 text-grey-7" data-cy="auth-required-message">{{ resolved.message }}</div>
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

const AUTH_REQUIRED_PRESETS = {
  login: {
    title: 'Authentication Required',
    message: 'Please log in to access this page.',
    icon: 'lock'
  },
  admin: {
    title: 'Access Denied',
    message: "You don't have administrator privileges.",
    icon: 'security'
  },
  custom: {
    title: 'Authentication Required',
    message: 'Please log in to access this page.',
    icon: 'lock'
  }
}

const resolved = computed(() => {
  const preset = AUTH_REQUIRED_PRESETS[props.type] || AUTH_REQUIRED_PRESETS.login
  return {
    title: props.title || preset.title,
    message: props.message || preset.message,
    icon: props.icon || preset.icon
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
