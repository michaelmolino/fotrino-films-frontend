<template>
  <q-header class="bg-primary">
    <q-toolbar>
      <q-toolbar-title>
        <LogoBranding />
      </q-toolbar-title>

      <q-btn
        icon="fas fa-circle-question"
        :label="$q.screen.gt.sm ? 'Help' : ''"
        flat
        no-caps
        size="md"
        to="/help" />

      <HistoryDropdown />
      <DarkModeDropdown />
      <LoginDropdown v-if="!profile?.id" />
      <AccountDropdown v-else :profile="profile" />
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

import LogoBranding from './FotrinoHeader/LogoBranding.vue'
import HistoryDropdown from './FotrinoHeader/HistoryDropdown.vue'
import DarkModeDropdown from './FotrinoHeader/DarkModeDropdown.vue'
import LoginDropdown from './FotrinoHeader/LoginDropdown.vue'
import AccountDropdown from './FotrinoHeader/AccountDropdown.vue'

const store = useStore()
const profile = computed(() => store.state.account?.profile || null)
</script>
