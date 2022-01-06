<template>
  <div class="q-py-sm q-px-lg row no-wrap items-center">
    <span class="text-center">
      <q-btn
        flat
        icon="copyright"
        :label="$q.screen.gt.xs ? year + ' Michael Molino' : year"
        :ripple="false"
        type="image/png"
      />
    </span>
    <q-space />
    <span class="text-center">
      <q-btn
        flat
        icon="policy"
        :label="$q.screen.gt.xs ? 'Terms/Privacy' : ''"
        to="/terms"
      />
    </span>
    <span class="q-pr-lg text-center">
      <q-btn
        flat
        icon="fab fa-github"
        :label="$q.screen.gt.xs ? 'GitHub' : ''"
        href="https://github.com/michaelmolino/fotrino-films-frontend"
      />
    </span>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  data () {
    return {
      year: null
    }
  },
  mounted () {
    this.year = new Date().getFullYear()
  }
}
</script>
