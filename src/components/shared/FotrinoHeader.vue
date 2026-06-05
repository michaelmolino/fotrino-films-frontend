<template>
  <q-header class="bg-primary">
    <q-toolbar>
      <q-toolbar-title>
        <LogoBranding />
      </q-toolbar-title>
      <HistoryDropdown />
      <DarkModeDropdown />
      <LoginDropdown v-if="showLoginMenu" />
      <AccountDropdown v-else :profile="profile" />
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { computed } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'

import LogoBranding from './FotrinoHeader/LogoBranding.vue'
import HistoryDropdown from './FotrinoHeader/HistoryDropdown.vue'
import DarkModeDropdown from './FotrinoHeader/DarkModeDropdown.vue'
import LoginDropdown from './FotrinoHeader/LoginDropdown.vue'
import AccountDropdown from './FotrinoHeader/AccountDropdown.vue'

const accountStore = useAccountStore()
const profile = computed(() => accountStore.profile)
const isAuthenticated = computed(() => !!profile.value)
const showLoginMenu = computed(() => !isAuthenticated.value)
</script>
