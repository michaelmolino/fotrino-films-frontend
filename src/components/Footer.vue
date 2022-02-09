<template>
  <div class="row no-wrap">
    <q-btn
      flat
      icon="copyright"
      :label="$q.screen.gt.xs ? year + ' Michael Molino' : year"
      :ripple="false"
      class="no-pointer-events"
    />
    <q-space />
    <q-btn
      flat
      icon="policy"
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
</template>

<script>
export default {
  name: 'Footer-Bar',

  data () {
    return {
      year: 2021
    }
  },

  mounted () {
    this.year = new Date().getFullYear()
  }
}
</script>
