<template>
  <div class="fullscreen bg-warning text-black flex flex-center">
    <q-card flat bordered class="q-pa-xl text-center card-center">
      <q-icon name="sentiment_very_dissatisfied" color="warning" size="64px" class="q-mb-md" />
      <div class="text-h1 q-mb-xs">409</div>
      <div class="text-h5 q-mb-md">Conflict</div>
      <div class="text-caption text-grey-8 q-mb-lg">
        This error usually means that you are trying to login using an email address that we
        recognise, but using a different identity provider. For example, this can happen if you
        first logged in with Facebook and are now trying to log in with Google. Please try logging
        in again using the same identity provider you used when you created your account.
      </div>
      <q-btn
        class="q-py-md q-mt-md"
        icon="fas fa-house"
        label="Home"
        color="primary"
        unelevated
        no-caps
        size="lg"
        to="/"
      />
    </q-card>
  </div>
</template>

<script setup>
defineOptions({ name: 'Error-409' })
</script>

<style scoped>
.card-center {
  max-width: 400px;
  margin: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
