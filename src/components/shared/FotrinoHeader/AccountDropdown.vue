<template>
  <q-btn-dropdown
    :icon="'img:' + profile.profile_pic"
    :label="$q.screen.gt.sm ? 'Account' : ''"
    flat
    no-caps
    size="md">
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        v-if="profile?.is_admin"
        to="/admin"
        align="left"
        flat
        no-caps
        icon="fas fa-user-shield"
        label="Admin"
        size="md"
        class="col-xs-12" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        to="/account/dashboard"
        align="left"
        flat
        no-caps
        icon="fas fa-chalkboard"
        label="Dashboard"
        size="md"
        class="col-xs-12" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        to="/account/upload"
        align="left"
        flat
        no-caps
        icon="fas fa-cloud-arrow-up"
        label="Upload Media"
        size="md"
        class="col-xs-12" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        @click="logout(store)"
        align="left"
        flat
        no-caps
        icon="fas fa-right-from-bracket"
        label="Logout"
        size="md"
        class="col-xs-12" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { useStore } from 'vuex'
import { useQuasar } from 'quasar'
import { logout } from '@utils/auth.js'

const $q = useQuasar()
const store = useStore()

defineProps({
  profile: {
    type: Object,
    required: true
  }
})
</script>
