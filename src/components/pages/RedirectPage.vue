<template>
  <div class="absolute-center q-pa-xl">
    <q-spinner color="primary" size="40px" class="q-mb-md" />
    <div class="text-h6 q-mb-sm">Redirecting you to your destination...</div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getRedirect } from '@utils/auth'

const route = useRoute()

onMounted(() => {
  window.location.href = getRedirect(route)
})
</script>
