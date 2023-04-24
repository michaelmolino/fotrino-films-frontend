<template>
  <q-header class="bg-primary">
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
          :icon="showHistory ? 'history' : 'videocam'"
          @before-show="showHistory = true"
          @before-hide="showHistory = false"
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
              icon="remove_circle"
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
        disabled
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
            :href="provider.login"
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
          to="/profile"
          align="left"
          flat
          no-caps
          icon="account_box"
          label="Profile"
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
          :href="logout"
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
  name: 'FotrinoHeader',

  data() {
    return {
      showHistory: false,
      logout: process.env.API + '/account/logout',
      oauthProviders: [
        {
          name: 'Facebook',
          icon: 'fab fa-facebook',
          login: process.env.API + '/account/login/facebook'
        },
        {
          name: 'Google',
          icon: 'fab fa-google',
          login: process.env.API + '/account/login/google'
        }
      ]
    }
  },

  created: function() {
    this.$store.dispatch('collection/getHistory')
  },

  computed: {
    history: {
      get() {
        return this.$store.state.collection.history
      }
    },
    darkMode: {
      get() {
        return this.$q.dark.isActive
      },
      set(value) {
        this.$q.dark.set(value)
      }
    },
    profile: {
      get() {
        return this.$store.state.account.profile
      }
    }
  }
}
</script>
