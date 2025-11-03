<template>
  <q-footer reveal class="bg-secondary">
    <div class="row no-wrap">
      <q-btn
        flat
        icon="info"
        :label="$q.screen.gt.xs ? year + ' Michael Molino' : year"
        :ripple="false"
        class="no-pointer-events"
        aria-label="Copyright information" />
      <q-space />
      <q-btn
        flat
        icon="description"
        :label="$q.screen.gt.xs ? 'Terms/Privacy' : ''"
        to="/terms"
        aria-label="Terms and Privacy Policy" />
      <q-btn
        icon="help_outline"
        :label="$q.screen.gt.sm ? 'Help' : ''"
        flat
        no-caps
        size="md"
        to="/help"
        aria-label="Help and documentation" />
      <q-btn
        flat
        :icon="`img:${githubIcon}`"
        :label="$q.screen.gt.xs ? 'GitHub' : ''"
        href="https://github.com/michaelmolino/fotrino-films-frontend"
        target="_blank"
        aria-label="View source code on GitHub" />
    </div>
  </q-footer>
</template>

<script setup>
import githubIcon from '@assets/icons/github.svg'
const year = new Date().getFullYear()
</script>
