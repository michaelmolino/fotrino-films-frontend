<template>
  <div class="admin-dashboard-page q-pa-md" data-cy="admin-dashboard">
    <template v-if="isAdmin">
      <div class="text-h6 text-weight-bold">Admin: All Users</div>
      <div class="text-caption text-grey-7 q-mb-md">All registered users.</div>
      <AdminUserList class="q-mb-xl" />
      <AdminDLQ class="q-mb-xl" />
      <AdminReportedMedia />
    </template>
    <AuthRequired v-else :type="isAuthenticated ? 'admin' : 'login'" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import AdminUserList from './AdminDashboard/AdminUserList.vue'
import AdminDLQ from './AdminDashboard/AdminDLQ.vue'
import AdminReportedMedia from './AdminDashboard/AdminReportedMedia.vue'
import AuthRequired from '@components/shared/AuthRequired.vue'

const store = useStore()
const profile = computed(() => store.state.account.profile)
const isAuthenticated = computed(() => !!profile.value?.id)
const isAdmin = computed(() => profile.value?.is_admin === true)
</script>
