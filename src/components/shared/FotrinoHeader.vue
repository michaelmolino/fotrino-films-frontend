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
          split
          :icon="showHistory ? 'history' : 'videocam'"
          @before-show="showHistory = true"
          @before-hide="showHistory = false"
          :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
          to="/"
          flat
          no-caps
          size="lg"
        >
          <div v-for="channel in history" :key="channel.uuid" class="row">
            <q-btn
              icon="fas fa-clapperboard"
              align="left"
              flat
              no-caps
              no-wrap
              class="col-xs-10"
              :label="channel.title"
              size="md"
              :to="'/' + channel.uuid + '/' + channel.slug"
            />
            <q-btn
              icon="fas fa-circle-minus"
              flat
              no-caps
              no-wrap
              class="col-xs-2"
              size="md"
              @click="$store.dispatch('channel/rmHistory', channel.uuid)"
            />
          </div>
          <div v-if="history.length === 0" class="row q-pa-sm">
            No history
          </div>
        </q-btn-dropdown>
      </q-toolbar-title>

      <q-toggle
        v-model="darkMode"
        unchecked-icon="far fa-sun"
        checked-icon="far fa-moon"
        color="secondary"
        keep-color
        size="md"
      >
        <q-tooltip>Dark Mode</q-tooltip>
      </q-toggle>

      <q-btn
        icon="fas fa-circle-question"
        :label="$q.screen.gt.sm ? 'Help' : ''"
        flat
        no-caps
        size="md"
        to="/help"
      />

      <q-btn-dropdown
        v-if="!profile?.id"
        icon="fas fa-user"
        :label="$q.screen.gt.sm ? 'Sign Up/Login' : ''"
        flat
        no-caps
        size="md"
      >
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
            @click="storeRedirect"
          />
        </span>
      </q-btn-dropdown>
      <q-btn-dropdown
        v-if="profile?.id"
        :icon="'img:' + profile.profile_pic"
        :label="$q.screen.gt.sm ? 'Account' : ''"
        flat
        no-caps
        size="md"
      >
        <q-separator />
        <q-btn
          to="/account/dashboard"
          align="left"
          flat
          no-caps
          icon="fas fa-chalkboard"
          label="Dashboard"
          size="md"
          class="fit"
        />
        <q-separator />
        <q-btn
          href="/account/upload"
          align="left"
          flat
          no-caps
          icon="fas fa-cloud-arrow-up"
          label="Upload Media"
          size="md"
          class="fit"
        />
        <q-separator />
        <q-btn
          :href="logout"
          align="left"
          flat
          no-caps
          icon="fas fa-right-from-bracket"
          label="Logout"
          size="md"
          class="fit"
        />
      </q-btn-dropdown>
    </q-toolbar>
  </q-header>
</template>

<script>
import { LocalStorage } from 'quasar'

export default {
  name: 'FotrinoHeader',

  data() {
    return {
      showHistory: false,
      logout: process.env.API + '/account/logout',
      oauthProviders: [
        {
          name: 'Google',
          icon: 'fab fa-google',
          login: process.env.API + '/account/login/google'
        }
      ]
    }
  },

  created: function() {
    this.$store.dispatch('channel/getHistory')
  },

  computed: {
    history: {
      get() {
        return this.$store.state.channel.history
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
  },

  methods: {
    storeRedirect() {
      LocalStorage.set('postLoginRedirect', window.location.pathname)
    }
  }
}
</script>
