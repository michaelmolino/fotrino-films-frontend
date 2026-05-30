<template>
  <div class="admin-dashboard-page q-pa-md" data-cy="admin-dashboard">
    <template v-if="contentState === 'loading'">
      <q-skeleton type="text" width="260px" class="q-mb-md" animation="pulse" />
      <q-skeleton type="text" width="180px" class="q-mb-lg" animation="pulse" />
      <q-skeleton type="rect" class="q-mb-md admin-skeleton-row" animation="pulse" />
      <q-skeleton type="rect" class="q-mb-md admin-skeleton-row" animation="pulse" />
      <q-skeleton type="rect" class="admin-skeleton-row" animation="pulse" />
    </template>
    <template v-else-if="contentState === 'admin'">
      <div class="text-h6 text-weight-bold" data-cy="admin-all-users-title">Admin: All Users</div>
      <div class="text-caption text-grey-7 q-mb-md">All registered users.</div>
      <AdminUserList class="q-mb-xl" />
      <AdminJobs class="q-mb-xl" />
      <AdminMaintenance class="q-mb-xl" />
      <AdminReportedMedia />
    </template>
    <AuthRequired v-else :type="authRequiredType" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import AdminUserList from './AdminDashboard/AdminUserList.vue'
import AdminJobs from './AdminDashboard/AdminJobs.vue'
import AdminMaintenance from './AdminDashboard/AdminMaintenance.vue'
import AdminReportedMedia from './AdminDashboard/AdminReportedMedia.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'

const accountStore = useAccountStore()
const profile = computed(() => accountStore.profile)
const isAuthenticated = computed(() => !!profile.value)
const isAdmin = computed(() => profile.value?.isAdmin === true)
const isProfileResolved = computed(() => accountStore.profileResolved)
const contentState = computed(() => {
  if (!isProfileResolved.value) {
    return 'loading'
  }
  return isAdmin.value ? 'admin' : 'auth-required'
})
const authRequiredType = computed(() => (isAuthenticated.value ? 'admin' : 'login'))
</script>

<style scoped>
.admin-skeleton-row {
  min-height: 46px;
  border-radius: 8px;
}
</style>
