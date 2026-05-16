<template>
  <div class="fullscreen bg-warning text-black flex flex-center">
    <q-card flat bordered class="q-pa-xl text-center card-center">
      <q-icon name="person_off" color="warning" size="64px" class="q-mb-md" />
      <div class="text-h4 q-mb-sm">Account Deleted</div>
      <div class="text-body1 q-mb-md">
        This account has been deleted.
      </div>
      <div class="text-body2 q-mb-lg">
        Please contact
        <a class="text-primary" href="mailto:michael@fotrino.com">michael@fotrino.com</a>
        if you would like to re-enable it.
      </div>
      <q-btn
        class="q-py-md q-mt-sm"
        icon="home"
        label="Home"
        color="primary"
        unelevated
        no-caps
        size="lg"
        to="/" />
    </q-card>
  </div>
</template>

<script setup>
defineOptions({ name: 'Error-Account-Deleted' })
</script>

<style scoped>
.card-center {
  max-width: 520px;
  margin: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>