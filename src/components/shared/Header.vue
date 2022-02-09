<template>
  <q-header elevated class="bg-primary">
    <q-toolbar>
      <q-toolbar-title>
        <q-btn
          v-if="history.length === 0"
          icon="videocam"
          :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
          flat
          no-caps
          size="lg"
          to="/"
        />
        <q-btn-dropdown
          v-if="history.length > 0"
          icon="videocam"
          :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
          flat
          no-caps
          size="lg"
        >
          <div v-for="collection in history" :key="collection.uuid" class="row">
            <q-btn
              icon="movie"
              align="left"
              flat
              no-caps
              no-wrap
              class="col-xs-10"
              :label="collection.title"
              size="md"
              :to="'/' + collection.uuid + '/' + collection.slug"
            />
            <q-btn
              icon="clear"
              flat
              no-caps
              no-wrap
              class="col-xs-2"
              size="md"
              @click="$store.dispatch('collection/rmHistory', collection.uuid)"
            />
          </div>
        </q-btn-dropdown>
      </q-toolbar-title>

      <q-toggle
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
        :label="$q.screen.gt.sm ? 'Help' : ''"
        flat
        no-caps
        size="md"
        to="/help"
      />

      <q-btn-dropdown
        v-if="!profile.id"
        icon="account_box"
        :label="$q.screen.gt.sm ? 'Sign Up/Login' : ''"
        flat
        no-caps
        size="md"
      >
        <q-btn
          v-if="!$q.screen.gt.sm"
          flat
          no-caps
          size="md"
          class="fit no-pointer-events"
          label="Sign Up/Login"
        />
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
            class="fit"
          />
        </span>
      </q-btn-dropdown>
      <q-btn-dropdown
        v-if="profile.id"
        :icon="'img:' + profile.profile_pic"
        :label="$q.screen.gt.sm ? 'Account' : ''"
        flat
        no-caps
        size="md"
      >
        <q-separator />
        <q-btn
          to="/dashboard"
          align="left"
          flat
          no-caps
          icon="dashboard"
          label="Dashboard"
          size="md"
          class="fit"
        />
        <q-separator />
        <q-btn
          to="/pricing"
          align="left"
          flat
          no-caps
          icon="paid"
          label="Upgrade Account"
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
  </q-header>
</template>

<script>
export default {
  name: 'Header-Bar',

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

  created: function () {
    this.$store
      .dispatch('collection/fetchHistory')
  },

  computed: {
    history: {
      get () {
        return this.$store.state.collection.history
      }
    },
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
