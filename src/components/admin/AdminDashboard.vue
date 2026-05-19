<template>
  <div class="admin-dashboard-page q-pa-md" data-cy="admin-dashboard">
    <template v-if="isAdmin">
      <div class="text-h6 text-weight-bold" data-cy="admin-all-users-title">Admin: All Users</div>
      <div class="text-caption text-grey-7 q-mb-md">All registered users.</div>
      <AdminUserList class="q-mb-xl" />
      <AdminPendingJobs class="q-mb-xl" />
      <AdminDLQ class="q-mb-xl" />
      <AdminReportedMedia />
    </template>
    <AuthRequired v-else :type="isAuthenticated ? 'admin' : 'login'" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import AdminUserList from './AdminDashboard/AdminUserList.vue'
import AdminPendingJobs from './AdminDashboard/AdminPendingJobs.vue'
import AdminDLQ from './AdminDashboard/AdminDLQ.vue'
import AdminReportedMedia from './AdminDashboard/AdminReportedMedia.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'

const accountStore = useAccountStore()
const profile = computed(() => accountStore.profile)
const isAuthenticated = computed(() => !!profile.value?.id)
const isAdmin = computed(() => profile.value?.isAdmin === true)
</script>
