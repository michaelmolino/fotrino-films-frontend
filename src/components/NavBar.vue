<template>
  <q-toolbar class="bg-primary text-white">
    <q-toolbar-title>
      <q-btn
        icon="videocam"
        label="Fotrino Films"
        flat
        no-caps
        disabled
        size="lg"
      />
    </q-toolbar-title>
    <q-toggle
      v-model="darkMode"
      unchecked-icon="wb_sunny"
      checked-icon="nights_stay"
      :label="$q.screen.gt.xs ? 'Dark Mode' : ''"
      color="info"
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
