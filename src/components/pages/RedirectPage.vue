<template>
  <div class="absolute-center q-pa-xl">
    <q-spinner color="primary" size="40px" class="q-mb-md" />
    <div class="text-h6 q-mb-sm">Redirecting you to your destination...</div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { LocalStorage } from 'quasar'

const route = useRoute()

onMounted(() => {
  const redirectUrl = LocalStorage.getItem('postLoginRedirect') || '/'
  LocalStorage.remove('postLoginRedirect')

  const url =
    redirectUrl + (route.query?.newUser === 'true' ? '?showTerms=true' : '')

  window.location.href = url
})
</script>
