<template>
  <q-toolbar class="bg-primary text-white">
    <q-toolbar-title>
      <q-btn
        icon="videocam"
        label="Fotrino Films"
        flat
        no-caps
        size="lg"
        :to="'/' + $route.params.userUuid"
      />
    </q-toolbar-title>
  </q-toolbar>
</template>

<script>
export default {
  name: 'NavBar'
}
</script>
