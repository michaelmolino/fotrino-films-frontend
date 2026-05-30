<template>
  <q-footer
    :reveal="!$q.platform.is.mobile"
    class="bg-secondary app-footer"
    :class="{ 'app-footer--compact': isShortLandscape }"
    data-cy="app-footer">
    <div class="row no-wrap">
      <div class="footer-static-info" aria-label="Copyright information">
        <q-icon name="info" size="18px" class="q-mr-xs" aria-hidden="true" />
        <span>{{ copyrightLabel }}</span>
      </div>
      <q-space />
      <q-btn
        flat
        icon="description"
        :label="termsLabel"
        to="/terms"
        data-cy="footer-terms-link"
        aria-label="Terms and Privacy Policy" />
      <q-btn
        icon="help_outline"
        :label="helpLabel"
        flat
        no-caps
        size="md"
        to="/help"
        data-cy="footer-help-link"
        aria-label="Help and documentation" />
      <q-btn
        flat
        href="https://github.com/michaelmolino/fotrino-films-frontend"
        target="_blank"
        aria-label="View source code on GitHub">
        <q-icon :name="`img:${githubIcon}`" class="github-icon--white q-mr-sm" aria-hidden="true" />
        <span v-if="showGithubText">GitHub</span>
      </q-btn>
    </div>
  </q-footer>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import githubIcon from '@assets/icons/github.svg'

const $q = useQuasar()
const year = new Date().getFullYear()
const isShortLandscape = computed(
  () => $q.platform.is.mobile && $q.screen.landscape && $q.screen.height <= 460
)
const copyrightLabel = computed(() => ($q.screen.gt.sm ? `${year} Michael Molino` : String(year)))
const termsLabel = computed(() =>
  $q.screen.gt.xs && !isShortLandscape.value ? 'Terms/Privacy' : ''
)
const helpLabel = computed(() => ($q.screen.gt.xs && !isShortLandscape.value ? 'Help' : ''))
const showGithubText = computed(() => $q.screen.gt.xs && !isShortLandscape.value)
</script>

<style scoped>
.app-footer {
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateZ(0);
}

.app-footer--compact {
  padding-top: 2px;
  padding-bottom: max(2px, env(safe-area-inset-bottom));
}

.app-footer--compact :deep(.q-btn) {
  min-height: 40px;
  padding: 2px 6px;
}

.footer-static-info {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

:deep(.github-icon--white) {
  width: 20px;
  height: 20px;
  filter: invert(1) brightness(1.6);
}
</style>
