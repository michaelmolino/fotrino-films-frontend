<template>
  <q-toolbar>
    <q-toolbar-title>
      <q-btn
        icon="videocam"
        :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
        flat
        no-caps
        size="lg"
        to="/"
      />
    </q-toolbar-title>

    <q-toggle
      class="q-px-sm vertical-middle"
      v-model="darkMode"
      unchecked-icon="wb_sunny"
      checked-icon="nights_stay"
      color="secondary"
      keep-color
      size="md"
    >
      <q-tooltip>Dark Mode</q-tooltip>
    </q-toggle>

    <q-btn
      icon="help"
      :label="$q.screen.gt.xs ? 'Help' : ''"
      flat
      no-caps
      size="md"
      to="/about"
    />

    <q-btn-dropdown
      v-if="!profile"
      icon="account_box"
      :label="$q.screen.gt.xs ? 'Login' : ''"
      flat
      no-caps
      size="md"
    >
      <span v-for="provider in oauthProviders" :key="provider.name">
        <q-separator />
        <q-btn
          :href="'/api/account/login/' + provider.name.toLowerCase()"
          align="left"
          flat
          no-caps
          :icon="provider.icon"
          :label="provider.name"
          size="md"
          class="q-px-sm fit"
        />
      </span>
    </q-btn-dropdown>
    <q-btn-dropdown
      v-if="profile"
      :icon="'img:' + profile.profile_pic"
      :label="$q.screen.gt.xs ? 'Account' : ''"
      flat
      no-caps
      size="md"
      class="q-px-sm"
    >
      <q-separator />
      <q-btn
        to="/dashboard"
        align="left"
        flat
        no-caps
        icon="dashboard"
        label="Collections Dashboard"
        size="md"
        class="fit"
      />
      <q-separator />
      <q-btn
        :href="'/api/account/logout?route=' + $route.fullPath"
        align="left"
        flat
        no-caps
        icon="logout"
        label="Logout"
        size="md"
        class="fit"
      />
    </q-btn-dropdown>
  </q-toolbar>
</template>

<script>
export default {
  name: 'NavBar',
  data () {
    return {
      // oauthProviders: [
      //   { name: 'Facebook', icon: 'fab fa-facebook' },
      //   { name: 'GitHub', icon: 'fab fa-github' },
      //   { name: 'Google', icon: 'fab fa-google' },
      //   { name: 'Instagram', icon: 'fab fa-instagram' },
      //   { name: 'Live', icon: 'fab fa-microsoft' },
      //   { name: 'Reddit', icon: 'fab fa-reddit' },
      //   { name: 'Twitter', icon: 'fab fa-twitter' }
      // ]
      oauthProviders: [
        { name: 'Facebook', icon: 'fab fa-facebook' },
        { name: 'Google', icon: 'fab fa-google' }
      ]
    }
  },
  computed: {
    darkMode: {
      get () {
        return this.$q.dark.isActive
      },
      set (value) {
        this.$q.dark.set(value)
      }
    },
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    }
  }
}
</script>
