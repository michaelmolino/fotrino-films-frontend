<template>
  <q-toolbar>
    <q-toolbar-title>
      <q-btn
        icon="videocam"
        label="Fotrino Films"
        flat
        no-caps
        size="lg"
        to="/"
      />
    </q-toolbar-title>
    <q-toggle
      class="text-uppercase"
      v-model="darkMode"
      unchecked-icon="wb_sunny"
      checked-icon="nights_stay"
      :label="$q.screen.gt.xs ? 'Dark Mode' : ''"
      color="secondary"
      keep-color
    />
  </q-toolbar>
</template>

<script>
export default {
  name: 'NavBar',
  computed: {
    darkMode: {
      get () {
        return this.$q.dark.isActive
      },
      set (value) {
        this.$q.dark.set(value)
      }
    }
  }
}
</script>
