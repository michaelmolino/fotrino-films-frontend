<template>
  <div class="admin-dashboard-page q-pa-md">
    <div class="text-h6 text-weight-bold">Admin: All Users</div>
    <div class="text-caption text-grey-7 q-mb-md">All registered users.</div>
    <AdminUserList class="q-mb-xl" />
    <AdminDeadOutbox class="q-mb-xl" />
    <AdminReportedMedia />
  </div>
</template>

<script setup>
import AdminUserList from './AdminDashboard/AdminUserList.vue'
import AdminDeadOutbox from './AdminDashboard/AdminDeadOutbox.vue'
import AdminReportedMedia from './AdminDashboard/AdminReportedMedia.vue'
</script>
