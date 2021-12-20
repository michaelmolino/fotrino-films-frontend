<template>
  <q-toolbar class="bg-primary text-white">
    <q-toolbar-title>
      <q-btn
        :to="'/' + $route.params.userUuid"
        icon="videocam"
        :label="!$q.platform.is.mobile ? 'Fotrino Films' : ''"
        flat
        no-caps
        size="lg"
      />
    </q-toolbar-title>
  </q-toolbar>
</template>

<script>
export default {
  name: 'NavBar',
  data () {
    return {
      isLoggedIn: false,
      oauthProviders: ['']
    }
  }
}
</script>
