<template>
  <q-footer reveal class="bg-secondary">
    <div class="row no-wrap">
      <q-btn
        flat
        icon="far fa-copyright"
        :label="$q.screen.gt.xs ? year + ' Michael Molino' : year"
        :ripple="false"
        class="no-pointer-events"
      />
      <q-space />
      <q-btn
        flat
        icon="fas fa-shield-halved"
        :label="$q.screen.gt.xs ? 'Terms/Privacy' : ''"
        to="/terms"
      />
      <q-btn
        flat
        icon="fab fa-github"
        :label="$q.screen.gt.xs ? 'GitHub' : ''"
        href="https://github.com/michaelmolino/fotrino-films-frontend"
        target="_blank"
      />
    </div>
  </q-footer>
</template>

<script>
export default {
  name: 'FotrinoFooter',

  data() {
    return {
      year: 2021
    }
  },

  created() {
    this.year = new Date().getFullYear()
  }
}
</script>
