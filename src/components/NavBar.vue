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
    <q-btn-dropdown icon="settings" label="Settings" flat no-caps size="lg">
      <q-toggle
        class="text-uppercase"
        label="Dark Mode"
        v-model="darkMode"
        unchecked-icon="wb_sunny"
        checked-icon="nights_stay"
        color="secondary"
        keep-color
      />
    </q-btn-dropdown>
    <q-btn-dropdown icon="account_box" label="Login" flat no-caps size="lg">
      <q-btn flat icon="facebook" label="Facebook" size="md" />
      <q-separator />
      <q-btn flat icon="mail" label="Gmail" size="md" />
      <q-separator />
      <q-btn flat icon="reddit" label="Reddit" size="md" />
      <q-separator />
    </q-btn-dropdown>
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
