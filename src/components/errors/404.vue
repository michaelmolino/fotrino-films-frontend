<template>
  <div class="fullscreen bg-warning text-black flex flex-center">
    <q-card flat bordered class="q-pa-xl text-center card-center">
      <q-icon name="sentiment_very_dissatisfied" color="warning" size="64px" class="q-mb-md" />
      <div class="text-h1 q-mb-xs">{{ content.code }}</div>
      <div class="text-h5 q-mb-md">{{ content.title }}</div>
      <q-btn
        class="q-py-md q-mt-md"
        icon="home"
        :label="content.ctaLabel"
        color="primary"
        unelevated
        no-caps
        size="lg"
        to="/" />
    </q-card>
  </div>
</template>

<script setup>
defineOptions({ name: 'Error-404' })

const content = {
  code: '404',
  title: 'Page Not Found',
  ctaLabel: 'Home'
}
</script>

<style scoped>
.card-center {
  max-width: 400px;
  margin: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
