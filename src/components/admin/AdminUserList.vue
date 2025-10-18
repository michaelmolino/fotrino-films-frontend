<template>
  <div>
    <q-list bordered class="rounded-borders">
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
                  icon="fas fa-link"
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
    <div v-if="users.length === 0" class="q-pa-md text-grey-6 text-center">
      No users found
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { daysSince } from '@utils/date.js'
import { getCountry } from '@utils/countries.js'

const store = useStore()
const users = computed(() => store.state.admin.users || [])
const providerIcons = {
  google: 'fab fa-google',
  microsoft: 'fab fa-microsoft',
  facebook: 'fab fa-facebook',
  github: 'fab fa-github',
  apple: 'fab fa-apple',
  yahoo: 'fab fa-yahoo'
}

onMounted(() => {
  store.dispatch('admin/getAllUsers')
})
</script>

<style scoped>
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
