<template>
  <div class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-md">Admin: All Users</div>
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
        <AuthRequired v-if="!isAuthenticated" type="login" message="Please log in to access the admin dashboard." />
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
                      class="text-primary q-ml-xs"
                    />
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
                      :title="`Visit ${channel.title}`"
                    />
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
            <div v-else class="q-pa-md text-grey-6 text-center">
              No channels
            </div>
          </q-expansion-item>
        </q-list>
        <div v-if="isAdmin && users.length === 0" class="q-pa-md text-grey-6 text-center">No users found</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import AuthRequired from '@components/shared/AuthRequired.vue'
import { daysSince } from '@utils/date.js'

const store = useStore()
const loading = ref(true)
const hasFetched = ref(false)

const profile = computed(() => store.state.account?.profile)
const users = computed(() => store.state.admin.users || [])
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

const countries = {
  US: { flag: '🇺🇸', name: 'United States' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  DE: { flag: '🇩🇪', name: 'Germany' },
  FR: { flag: '🇫🇷', name: 'France' },
  IT: { flag: '🇮🇹', name: 'Italy' },
  ES: { flag: '🇪🇸', name: 'Spain' },
  NL: { flag: '🇳🇱', name: 'Netherlands' },
  BE: { flag: '🇧🇪', name: 'Belgium' },
  CH: { flag: '🇨🇭', name: 'Switzerland' },
  AT: { flag: '🇦🇹', name: 'Austria' },
  SE: { flag: '🇸🇪', name: 'Sweden' },
  NO: { flag: '🇳🇴', name: 'Norway' },
  DK: { flag: '🇩🇰', name: 'Denmark' },
  FI: { flag: '🇫🇮', name: 'Finland' },
  PL: { flag: '🇵🇱', name: 'Poland' },
  CZ: { flag: '🇨🇿', name: 'Czech Republic' },
  HU: { flag: '🇭🇺', name: 'Hungary' },
  RO: { flag: '🇷🇴', name: 'Romania' },
  BG: { flag: '🇧🇬', name: 'Bulgaria' },
  GR: { flag: '🇬🇷', name: 'Greece' },
  PT: { flag: '🇵🇹', name: 'Portugal' },
  IE: { flag: '🇮🇪', name: 'Ireland' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  NZ: { flag: '🇳🇿', name: 'New Zealand' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  KR: { flag: '🇰🇷', name: 'South Korea' },
  CN: { flag: '🇨🇳', name: 'China' },
  IN: { flag: '🇮🇳', name: 'India' },
  BR: { flag: '🇧🇷', name: 'Brazil' },
  MX: { flag: '🇲🇽', name: 'Mexico' },
  AR: { flag: '🇦🇷', name: 'Argentina' },
  CL: { flag: '🇨🇱', name: 'Chile' },
  CO: { flag: '🇨🇴', name: 'Colombia' },
  PE: { flag: '🇵🇪', name: 'Peru' },
  ZA: { flag: '🇿🇦', name: 'South Africa' },
  EG: { flag: '🇪🇬', name: 'Egypt' },
  NG: { flag: '🇳🇬', name: 'Nigeria' },
  KE: { flag: '🇰🇪', name: 'Kenya' },
  RU: { flag: '🇷🇺', name: 'Russia' },
  UA: { flag: '🇺🇦', name: 'Ukraine' },
  TR: { flag: '🇹🇷', name: 'Turkey' }
}

function getCountry(countryCode) {
  return countries[countryCode?.toUpperCase()] || { flag: '🏳️', name: 'Unknown' }
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

onMounted(() => {
  // Try to fetch immediately if profile is already loaded
  if (profile.value !== undefined) {
    fetchUsers()
  }
})

// Watch for profile changes and fetch when it becomes available
watch(profile, (newProfile) => {
  if (newProfile !== undefined && !hasFetched.value) {
    fetchUsers()
  }
}, { immediate: true })
</script>

<style scoped>
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
