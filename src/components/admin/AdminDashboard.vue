<template>
  <div class="admin-dashboard-page q-pa-md">
  <div class="text-h6 text-weight-bold">Admin: All Users</div>
  <div class="text-caption text-grey-7 q-mb-md">All registered users.</div>
    <div class="admin-tree">
      <template v-if="loading">
        <div class="q-pa-lg">
          <div class="q-mb-md" v-for="i in 3" :key="i">
            <q-item class="q-pa-md">
              <q-item-section avatar>
                <q-skeleton type="QAvatar" size="48px" />
              </q-item-section>
              <q-item-section>
                <q-skeleton type="text" width="40%" />
                <q-skeleton type="text" width="60%" />
                <q-skeleton type="text" width="30%" />
              </q-item-section>
            </q-item>
          </div>
        </div>
      </template>
      <template v-else>
        <AuthRequired
          v-if="!isAuthenticated"
          type="login"
          message="Please log in to access the admin dashboard." />
        <AuthRequired v-else-if="!isAdmin" type="admin" />
        <q-list v-else bordered class="rounded-borders">
          <q-expansion-item
            v-for="user in users"
            :key="user.id"
            group="users"
            expand-icon-toggle
            expand-separator
            switch-toggle-side
            class="user-item">
            <template #header>
              <q-item-section avatar>
                <div class="relative-position">
                  <q-avatar size="48px">
                    <img :src="user.profile_pic" />
                  </q-avatar>
                  <q-badge
                    v-if="user.is_admin"
                    floating
                    color="accent"
                    text-color="white"
                    class="admin-badge">
                    <q-icon name="fas fa-user-shield" size="12px" />
                  </q-badge>
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  <span>{{ user.name }}</span>
                  <span
                    v-if="user.country"
                    class="flag-emoji q-ml-sm"
                    :title="getCountry(user.country).name">
                    {{ getCountry(user.country).flag }}
                  </span>
                </q-item-label>
                <q-item-label caption>
                  <span class="q-mr-sm">
                    <q-icon
                      v-for="provider in user.providers"
                      :key="provider.provider"
                      :name="providerIcons[provider.provider]"
                      size="16px"
                      :title="provider.provider"
                      class="text-primary q-ml-xs" />
                  </span>
                  <span>{{ user.email }}</span>
                </q-item-label>
                <q-item-label caption class="text-grey-7 q-mt-xs" v-if="user.last_login">
                  Last login: {{ daysSince(user.last_login, true) }}
                </q-item-label>
                <q-item-label caption class="text-grey-7 q-mt-xs" v-else>
                  Never logged in
                </q-item-label>
              </q-item-section>
            </template>

            <div v-if="user.channels?.length > 0" class="q-pa-sm">
              <q-list dense>
                <q-item
                  v-for="channel in user.channels"
                  :key="channel.uuid"
                  class="channel-item q-pl-lg">
                  <q-item-section avatar>
                    <q-avatar size="32px">
                      <img :src="channel.cover || '/images/channel.png'" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      :to="`/${channel.uuid}/${channel.slug}`"
                      icon="fas fa-external-link-alt"
                      flat
                      dense
                      size="sm"
                      color="primary"
                      :title="`Visit ${channel.title}`" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ channel.title }}</q-item-label>
                    <q-item-label caption class="text-grey-6">
                      Created: {{ daysSince(channel.created, true) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else class="q-pa-md text-grey-6 text-center">No channels</div>
          </q-expansion-item>
        </q-list>
        <div v-if="isAdmin && users.length === 0" class="q-pa-md text-grey-6 text-center">
          No users found
        </div>

        <!-- Dead Outbox Section -->
        <div v-if="isAdmin" class="q-mt-xl">
          <div class="text-h6 text-weight-bold">Admin: Dead Outbox Events</div>
          <div class="text-caption text-grey-7 q-mb-md">Events that exhausted retries or were marked dead.</div>
          <q-table
            flat
            bordered
            :rows="outboxDead"
            :columns="outboxColumns"
            row-key="id"
          >
            <template #body-cell-created="props">
              <q-td :props="props">{{ daysSince(props.row.created, true) }}</q-td>
            </template>
            <template #body-cell-type="props">
              <q-td :props="props"><code>{{ props.row.type }}</code></q-td>
            </template>
            <template #body-cell-payload="props">
              <q-td :props="props">
                <q-expansion-item dense expand-separator label="Payload">
                  <pre class="q-ma-none" style="white-space: pre-wrap">{{ pretty(props.row.payload) }}</pre>
                </q-expansion-item>
              </q-td>
            </template>
            <template #body-cell-last_error="props">
              <q-td :props="props">
                <q-expansion-item
                  v-if="props.row.last_error"
                  dense
                  expand-separator
                  :label="props.row.last_error.substring(0, 50) + (props.row.last_error.length > 50 ? '...' : '')">
                  <pre class="q-ma-none" style="white-space: pre-wrap">{{ props.row.last_error }}</pre>
                </q-expansion-item>
                <span v-else class="text-grey-6">—</span>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn dense size="sm" flat color="accent" icon="refresh" @click="requeue(props.row.id)">
                  <q-tooltip>Requeue</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { api } from 'boot/axios'

import { daysSince } from '@utils/date.js'
import { getCountry } from '@utils/countries.js'

const store = useStore()
const loading = ref(true)
const hasFetched = ref(false)

const profile = computed(() => store.state.account?.profile)
const users = computed(() => store.state.admin.users || [])
const outboxDead = computed(() => store.state.admin.outboxDead || [])
const isAuthenticated = computed(() => !!profile.value?.id)
const isAdmin = computed(() => profile.value?.is_admin === true)

const providerIcons = {
  google: 'fab fa-google',
  microsoft: 'fab fa-microsoft',
  facebook: 'fab fa-facebook',
  github: 'fab fa-github',
  apple: 'fab fa-apple',
  yahoo: 'fab fa-yahoo'
}

async function fetchUsers() {
  if (hasFetched.value) return

  if (!isAuthenticated.value) {
    loading.value = false
    return
  }
  if (!isAdmin.value) {
    loading.value = false
    return
  }

  hasFetched.value = true
  try {
    await store.dispatch('admin/getAllUsers')
  } catch (error) {
    console.debug('Admin Dashboard API call failed:', error.response?.status)
  }
  loading.value = false
}

// Handle race where profile may load after mount; trigger once when available
let firedProfileOnce = false
watch(
  profile,
  newProfile => {
    if (firedProfileOnce) return
    // Skip until profile is a non-null object (can be undefined or null initially)
    if (newProfile == null) return
    if (!hasFetched.value) {
      fetchUsers()
    }
    if (newProfile?.is_admin) {
      store.dispatch('admin/getDeadOutbox')
    }
    firedProfileOnce = true
  },
  { immediate: true }
)

const outboxColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'created', label: 'Created', field: 'created', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'left' },
  { name: 'attempts', label: 'Attempts', field: 'attempts', align: 'right' },
  { name: 'payload', label: 'Payload', field: 'payload', align: 'left' },
  { name: 'last_error', label: 'Last Error', field: 'last_error', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
]

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

async function requeue(eventId) {
  try {
    await api.post('/admin/outbox/requeue', { event_id: eventId, reset_attempts: true })
    // Refresh table
    await store.dispatch('admin/getDeadOutbox')
  } catch (e) {
    console.debug('Requeue failed', e)
  }
}
</script>

<style scoped>
.admin-dashboard-page {
  max-width: 1200px;
}
.admin-tree {
  overflow-x: hidden;
  max-width: 800px;
}
.user-avatar {
  min-width: 64px;
}
.channel-item {
  border-left: 2px solid var(--q-primary);
  margin-left: 1rem;
}
.admin-badge {
  z-index: 1;
}
@media (max-width: 600px) {
  .channel-item {
    margin-left: 0.5rem;
  }
}
</style>
