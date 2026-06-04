<template>
  <div>
    <div class="q-mb-md flex items-center gap-sm">
      <span class="text-body2 text-weight-medium">Filter:</span>
      <q-option-group v-model="filterMode" :options="filterOptions" color="primary" inline />
    </div>
    <div v-if="loading">
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
      <q-skeleton type="rect" height="40px" class="q-mb-sm" />
    </div>
    <q-table
      v-else
      flat
      bordered
      :rows="filteredUsers"
      :columns="userColumns"
      row-key="email"
      separator="cell"
      dense
      :pagination="{ rowsPerPage: 0 }">
      <template #body-cell-user="props">
        <q-td :props="props" class="user-cell-td">
          <div class="row items-center no-wrap user-cell">
            <div class="relative-position avatar-wrap q-mr-md">
              <q-avatar size="44px" :class="{ 'deleted-user': props.row.deleted }">
                <img
                  :src="resolveUserAvatar(props.row)"
                  :alt="`${props.row.name}'s avatar`"
                  loading="lazy"
                  decoding="async" />
              </q-avatar>
              <q-badge
                v-if="props.row.isAdmin"
                floating
                color="accent"
                text-color="white"
                class="admin-badge">
                <q-icon name="security" size="12px" />
              </q-badge>
              <q-badge
                v-if="props.row.newUser"
                floating
                color="warning"
                text-color="white"
                class="new-user-badge"
                style="top: 2px; right: 30px">
                <q-icon name="person_add" size="12px" />
              </q-badge>
              <q-badge
                v-if="props.row.deleted"
                floating
                color="negative"
                text-color="white"
                class="deleted-badge">
                <q-icon name="delete" size="12px" />
              </q-badge>
            </div>
            <div>
              <div class="text-weight-medium" :class="{ 'deleted-user': props.row.deleted }">
                <span>{{ props.row.name }}</span>
                <span
                  v-if="props.row.country"
                  class="flag-emoji q-ml-sm"
                  :title="getCountry(props.row.country).name">
                  {{ getCountry(props.row.country).flag }}
                </span>
              </div>
              <div caption :class="{ 'deleted-user': props.row.deleted }">
                <span class="q-mr-sm">
                  <q-icon
                    v-for="provider in props.row.providers"
                    :key="provider.provider"
                    :name="providerIcons[provider.provider]"
                    size="16px"
                    :title="provider.provider"
                    :class="providerIconClass" />
                </span>
                <span>{{ props.row.email }}</span>
              </div>
            </div>
          </div>
        </q-td>
      </template>
      <template #body-cell-lastLogin="props">
        <q-td :props="props" :class="{ 'deleted-user': props.row.deleted }">
          {{ props.row.lastLogin ? daysSince(props.row.lastLogin, true) : 'Never logged in' }}
        </q-td>
      </template>
      <template #body-cell-channels="props">
        <q-td :props="props">
          <q-expansion-item
            dense
            expand-separator
            :label="getChannelsLabel(props.row)"
            :disable="(props.row.channels?.length || 0) === 0">
            <div class="q-py-sm">
              <div
                v-for="channel in props.row.channels"
                :key="channel.publicId"
                class="channel-row q-px-sm q-py-xs">
                <div class="row items-center no-wrap">
                  <q-avatar size="28px" class="q-mr-sm">
                    <img
                      :src="resolveChannelCover(channel) || '/images/channel.png'"
                      :alt="`${channel.title} cover`"
                      loading="lazy"
                      decoding="async" />
                  </q-avatar>
                  <div class="col">
                    <div>{{ channel.title }}</div>
                    <div class="text-caption text-grey-6">
                      Created: {{ daysSince(channel.created, true) }}
                    </div>
                  </div>
                  <q-btn
                    :to="getChannelPath(channel)"
                    icon="link"
                    flat
                    dense
                    size="sm"
                    color="primary"
                    :title="`Visit ${channel.title}`"
                    :aria-label="`Visit ${channel.title}`" />
                </div>
              </div>
            </div>
          </q-expansion-item>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            v-if="props.row.newUser && !props.row.deleted"
            dense
            size="sm"
            flat
            color="positive"
            icon="check_circle"
            class="q-mr-xs"
            @click="approveUser(props.row)">
            <q-tooltip>Approve</q-tooltip>
          </q-btn>
          <q-btn
            v-if="!props.row.deleted"
            dense
            size="sm"
            flat
            color="negative"
            icon="delete"
            @click="deleteUser(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
          <q-btn v-else dense size="sm" flat color="grey-5" icon="delete" disable>
            <q-tooltip>Already deleted</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
    <div v-if="!loading && filteredUsers.length === 0" class="q-pa-md text-grey-6 text-center">
      No users found
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAdminStore } from 'src/stores/admin-store.js'
import { daysSince } from '@utils/date.js'
import { getCountry } from '@utils/countries.js'
import { buildChannelPath } from '@utils/channel-route.js'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'
import { getComponentApiErrorMessage } from 'src/utils/api-error-service.js'
import { notifyError, notifySuccess } from 'src/utils/notify.js'
import googleIcon from '@assets/icons/google.svg'
import microsoftIcon from '@assets/icons/microsoft.svg'
import facebookIcon from '@assets/icons/facebook.svg'
import githubIcon from '@assets/icons/github.svg'
import appleIcon from '@assets/icons/apple.svg'
import yahooIcon from '@assets/icons/yahoo.svg'

const $q = useQuasar()
const adminStore = useAdminStore()
const usersQuery = adminStore.useUsersQuery()
const loading = computed(() => usersQuery.isLoading.value && (adminStore.users || []).length === 0)
const USER_FILTER_KEY = 'admin.users.filterMode'
const USER_FILTER_VALUES = new Set(['all', 'new'])

function getInitialUserFilterMode() {
  if (globalThis.window === undefined) {
    return 'new'
  }
  const saved = globalThis.localStorage.getItem(USER_FILTER_KEY)
  return USER_FILTER_VALUES.has(saved) ? saved : 'new'
}

const filterMode = ref(getInitialUserFilterMode())
const filterOptions = [
  { label: 'All Users', value: 'all' },
  { label: 'New Users', value: 'new' }
]
const users = computed(() => adminStore.users || [])
const filteredUsers = computed(() => {
  if (filterMode.value === 'new') {
    return users.value.filter(user => user.newUser === true)
  }
  return users.value
})
const userColumns = [
  { name: 'user', label: 'User', field: 'name', align: 'left' },
  { name: 'lastLogin', label: 'Last Login', field: 'lastLogin', align: 'left' },
  { name: 'channels', label: 'Channels', field: 'channels', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
]
const providerIcons = {
  google: `img:${googleIcon}`,
  microsoft: `img:${microsoftIcon}`,
  facebook: `img:${facebookIcon}`,
  github: `img:${githubIcon}`,
  apple: `img:${appleIcon}`,
  yahoo: `img:${yahooIcon}`
}
const providerIconClass = computed(() =>
  $q.dark.isActive ? 'oauth-icon--white q-ml-xs' : 'q-ml-xs'
)

function getChannelsLabel(user) {
  const count = user.channels?.length || 0
  return count > 0 ? `Show Channels (${count})` : 'No Channels'
}

function getChannelPath(channel) {
  return buildChannelPath({ publicId: channel?.publicId, slug: channel?.slug })
}

function resolveUserAvatar(user) {
  return resolveImagePrimaryUrl(user?.avatarAsset) || '/images/channel.png'
}

function resolveChannelCover(channel) {
  return resolveImagePrimaryUrl(channel?.coverAsset)
}

watch(filterMode, value => {
  if (globalThis.window === undefined) {
    return
  }
  if (USER_FILTER_VALUES.has(value)) {
    globalThis.localStorage.setItem(USER_FILTER_KEY, value)
  }
})

const approveUser = async user => {
  try {
    const result = await adminStore.approveUser(user.email)
    if (result?.cancelled || result?.ok === false) return
    notifySuccess(`Approved ${user.name}. Welcome email sent.`)
  } catch (err) {
    console.error('Failed to approve user:', err)
    notifyError(getComponentApiErrorMessage(err, `Failed to approve ${user.name}.`), {
      timeout: 0
    })
  }
}

const deleteUser = async user => {
  try {
    const result = await adminStore.deleteUser(user.email)
    if (result?.cancelled || result?.ok === false) return
    notifySuccess(`Deleted ${user.name}.`)
  } catch (err) {
    console.error('Failed to delete user:', err)
    notifyError(getComponentApiErrorMessage(err, `Failed to delete ${user.name}.`), {
      timeout: 0
    })
  }
}

watch(
  () => usersQuery.error.value,
  err => {
    if (!err) {
      return
    }
    console.error('Failed to load users:', err)
    notifyError(getComponentApiErrorMessage(err, 'Failed to load users.'), { timeout: 0 })
  }
)
</script>

<style scoped>
.admin-badge {
  z-index: 1;
}
.new-user-badge {
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
.user-cell {
  min-width: 280px;
  padding-top: 6px;
  padding-bottom: 6px;
}
.user-cell-td {
  padding-top: 8px;
  padding-bottom: 8px;
}
.avatar-wrap {
  padding-right: 4px;
  min-width: 52px;
}
.channel-row + .channel-row {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
:deep(.q-table tbody td) {
  padding-top: 10px;
  padding-bottom: 10px;
}
@media (max-width: 600px) {
  .user-cell {
    min-width: 220px;
  }
  .user-cell-td {
    padding-top: 6px;
    padding-bottom: 6px;
  }
}
:deep(.oauth-icon--white) {
  filter: invert(1) brightness(1.2);
}
</style>
