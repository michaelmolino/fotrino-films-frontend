<template>
  <div>
    Redirecting...
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
