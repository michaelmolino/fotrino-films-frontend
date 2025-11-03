<template>
  <div>
    <div v-if="loading">
      <q-skeleton type="rect" height="48px" class="q-mb-sm" />
      <q-skeleton type="rect" height="48px" class="q-mb-sm" />
      <q-skeleton type="rect" height="48px" class="q-mb-sm" />
    </div>
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
              <q-avatar size="48px" :class="{ 'deleted-user': user.deleted }">
                <img
                  :src="user.profile_pic"
                  :alt="`${user.name}'s avatar`"
                  loading="lazy"
                  decoding="async" />
              </q-avatar>
              <q-badge
                v-if="user.is_admin"
                floating
                color="accent"
                text-color="white"
                class="admin-badge">
                <q-icon name="security" size="12px" />
              </q-badge>
              <q-badge
                v-if="user.deleted"
                floating
                color="negative"
                text-color="white"
                class="deleted-badge">
                <q-icon name="delete" size="12px" />
              </q-badge>
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium" :class="{ 'deleted-user': user.deleted }">
              <span>{{ user.name }}</span>
              <span
                v-if="user.country"
                class="flag-emoji q-ml-sm"
                :title="getCountry(user.country).name">
                {{ getCountry(user.country).flag }}
              </span>
              <q-btn
                v-if="!user.deleted"
                icon="delete"
                flat
                dense
                round
                size="sm"
                color="negative"
                class="q-ml-sm"
                @click.stop="deleteUser(user)"
                :title="`Delete ${user.name}`" />
              <q-btn
                v-else
                icon="delete"
                flat
                dense
                round
                size="sm"
                color="grey-5"
                class="q-ml-sm"
                disable
                :title="`${user.name} is already deleted`" />
            </q-item-label>
            <q-item-label caption :class="{ 'deleted-user': user.deleted }">
              <span class="q-mr-sm">
                <q-icon
                  v-for="provider in user.providers"
                  :key="provider.provider"
                  :name="providerIcons[provider.provider]"
                  size="16px"
                  :title="provider.provider"
                  :class="$q.dark.isActive ? 'oauth-icon--white q-ml-xs' : 'q-ml-xs'" />
              </span>
              <span>{{ user.email }}</span>
            </q-item-label>
            <q-item-label
              caption
              class="text-grey-7 q-mt-xs"
              v-if="user.last_login"
              :class="{ 'deleted-user': user.deleted }">
              Last login: {{ daysSince(user.last_login, true) }}
            </q-item-label>
            <q-item-label
              caption
              class="text-grey-7 q-mt-xs"
              v-else
              :class="{ 'deleted-user': user.deleted }">
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
                  <img
                    :src="channel.cover || '/images/channel.png'"
                    :alt="`${channel.title} cover`"
                    loading="lazy"
                    decoding="async" />
                </q-avatar>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  :to="`/${channel.uuid}/${channel.slug}`"
                  icon="link"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  :title="`Visit ${channel.title}`"
                  :aria-label="`Visit ${channel.title}`" />
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
    <div v-if="!loading && users.length === 0" class="q-pa-md text-grey-6 text-center">
      No users found
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { daysSince } from '@utils/date.js'
import { getCountry } from '@utils/countries.js'
import googleIcon from '@assets/icons/google.svg'
import microsoftIcon from '@assets/icons/microsoft.svg'
import facebookIcon from '@assets/icons/facebook.svg'
import githubIcon from '@assets/icons/github.svg'
import appleIcon from '@assets/icons/apple.svg'
import yahooIcon from '@assets/icons/yahoo.svg'

const store = useStore()
const loading = ref(true)
const users = computed(() => store.state.admin.users || [])
const providerIcons = {
  google: `img:${googleIcon}`,
  microsoft: `img:${microsoftIcon}`,
  facebook: `img:${facebookIcon}`,
  github: `img:${githubIcon}`,
  apple: `img:${appleIcon}`,
  yahoo: `img:${yahooIcon}`,
}

const deleteUser = async user => {
  await store.dispatch('admin/deleteUser', user.id)
}

onMounted(async () => {
  loading.value = true
  try {
    await store.dispatch('admin/getAllUsers')
  } finally {
    loading.value = false
  }
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
.deleted-badge {
  z-index: 2;
}
.deleted-user {
  opacity: 0.6;
  text-decoration: line-through;
}
.deleted-user img {
  filter: grayscale(100%);
}
@media (max-width: 600px) {
  .channel-item {
    margin-left: 0.5rem;
  }
}
:deep(.oauth-icon--white) {
  filter: invert(1) brightness(1.2);
}
</style>
