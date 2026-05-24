<template>
  <div class="fullscreen bg-warning text-black flex flex-center">
    <q-card flat bordered class="q-pa-xl text-center card-center">
      <q-icon name="person_off" color="warning" size="64px" class="q-mb-md" />
      <div class="text-h4 q-mb-sm">{{ content.title }}</div>
      <div class="text-body1 q-mb-md">{{ content.subtitle }}</div>
      <div class="text-body2 q-mb-lg">
        {{ content.contactPrefix }}
        <a class="text-primary" href="mailto:michael@fotrino.com">michael@fotrino.com</a>
        {{ content.contactSuffix }}
      </div>
      <q-btn
        class="q-py-md q-mt-sm"
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
defineOptions({ name: 'Error-Account-Deleted' })

const content = {
  title: 'Account Deleted',
  subtitle: 'This account has been deleted.',
  contactPrefix: 'Please contact',
  contactSuffix: 'if you would like to re-enable it.',
  ctaLabel: 'Home'
}
</script>

<style scoped>
.card-center {
  max-width: 520px;
  margin: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
