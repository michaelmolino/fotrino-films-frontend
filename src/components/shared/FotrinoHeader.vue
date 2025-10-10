<template>
  <q-header class="bg-primary">
    <q-toolbar>
      <q-toolbar-title>
        <!-- Logo / History Dropdown -->
        <template v-if="history.length === 0">
          <q-btn
            icon="img:/images/logo.png"
            :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
            flat
            no-caps
            size="lg"
            to="/" />
        </template>
        <template v-else>
          <q-btn-dropdown
            split
            :icon="showHistory ? 'history' : 'img:/images/logo.png'"
            @before-show="showHistory = true"
            @before-hide="showHistory = false"
            :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
            to="/"
            flat
            no-caps
            size="lg">
            <div v-for="channel in history" :key="channel.uuid" class="row items-center">
              <q-btn
                :icon="channel.cover ? 'img:' + channel.cover : 'fas fa-clapperboard'"
                align="left"
                flat
                no-caps
                no-wrap
                class="col-xs-10"
                :label="channel.title"
                size="md"
                :to="`/${channel.uuid}/${channel.slug}`" />
              <q-btn
                icon="fas fa-circle-minus"
                flat
                no-caps
                no-wrap
                class="col-xs-2"
                size="md"
                @click="removeHistory(channel.uuid)" />
            </div>
            <div v-if="history.length === 0" class="row q-pa-sm">No history</div>
          </q-btn-dropdown>
        </template>
      </q-toolbar-title>

      <!-- Help Button -->
      <q-btn
        icon="fas fa-circle-question"
        :label="$q.screen.gt.sm ? 'Help' : ''"
        flat
        no-caps
        size="md"
        to="/help" />

      <!-- Dark Mode -->
      <q-btn-dropdown
        :icon="darkModeIcon"
        :label="$q.screen.gt.sm ? 'Theme' : ''"
        size="md"
        flat
        no-caps>
        <q-separator />
        <q-btn
          flat
          no-caps
          align="left"
          icon="far fa-sun"
          label="Light"
          size="md"
          class="fit"
          @click="setDarkMode('light')" />
        <q-separator />
        <q-btn
          flat
          no-caps
          align="left"
          icon="fas fa-circle-half-stroke"
          label="System"
          size="md"
          class="fit"
          @click="setDarkMode('auto')" />
        <q-separator />
        <q-btn
          flat
          no-caps
          align="left"
          icon="far fa-moon"
          label="Dark"
          size="md"
          class="fit"
          @click="setDarkMode('dark')" />
      </q-btn-dropdown>

      <!-- Login Buttons -->
      <template v-if="!profile?.id">
        <q-btn-dropdown
          icon="fas fa-user"
          :label="$q.screen.gt.sm ? 'Sign Up/Login' : ''"
          flat
          no-caps
          size="md">
          <template v-for="provider in oauthProviders" :key="provider.name">
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
              @click="storeRedirect" />
          </template>
        </q-btn-dropdown>
      </template>

      <!-- Account Buttons -->
      <template v-else>
        <q-btn-dropdown
          :icon="'img:' + profile.profile_pic"
          :label="$q.screen.gt.sm ? 'Account' : ''"
          flat
          no-caps
          size="md">
          <q-separator />
          <q-btn
            to="/account/dashboard"
            align="left"
            flat
            no-caps
            icon="fas fa-chalkboard"
            label="Dashboard"
            size="md"
            class="fit" />
          <q-separator />
          <q-btn
            to="/account/upload"
            align="left"
            flat
            no-caps
            icon="fas fa-cloud-arrow-up"
            label="Upload Media"
            size="md"
            class="fit" />
          <q-separator />
          <q-btn
            @click="logout(store)"
            align="left"
            flat
            no-caps
            icon="fas fa-right-from-bracket"
            label="Logout"
            size="md"
            class="fit" />
        </q-btn-dropdown>
      </template>
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useQuasar } from 'quasar'
import { logout, storeRedirect } from '@utils/auth.js'
import { history, removeHistory, watchChannelHistory } from '@utils/history.js'
import { useDarkMode, darkModeIcons, setDarkMode } from '@utils/dark.js'

const $q = useQuasar()
const store = useStore()

const oauthProviders = ref([])
oauthProviders.value.push({ name: 'Google', icon: 'fab fa-google', login: process.env.API + '/account/login/google' })
if (process.env.NODE_ENV === 'development') {
  oauthProviders.value.push({ name: 'Apple', icon: 'fab fa-apple', login: process.env.API + '/account/login/apple' })
  oauthProviders.value.push({ name: 'Facebook', icon: 'fab fa-facebook', login: process.env.API + '/account/login/facebook' })
  oauthProviders.value.push({ name: 'Github', icon: 'fab fa-github', login: process.env.API + '/account/login/github' })
  oauthProviders.value.push({ name: 'Microsoft', icon: 'fab fa-microsoft', login: process.env.API + '/account/login/microsoft' })
  oauthProviders.value.push({ name: 'Yahoo', icon: 'fab fa-yahoo', login: process.env.API + '/account/login/yahoo' })
}

const profile = computed(() => store.state.account?.profile)

const showHistory = ref(false)
watchChannelHistory(store)

const { darkModePref } = useDarkMode($q)
const darkModeIcon = computed(() => darkModeIcons[darkModePref.value])
</script>
