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
        href="https://github.com/michaelmolino/fotrino-films-frontend"
        target="_blank"
        aria-label="View source code on GitHub">
        <q-icon :name="`img:${githubIcon}`" class="github-icon--white q-mr-sm" aria-hidden="true" />
        <span v-if="$q.screen.gt.xs">GitHub</span>
      </q-btn>
    </div>
  </q-footer>
</template>

<script setup>
import githubIcon from '@assets/icons/github.svg'
const year = new Date().getFullYear()
</script>

<style scoped>
:deep(.github-icon--white) {
  width: 20px;
  height: 20px;
  filter: invert(1) brightness(1.6);
}
</style>
