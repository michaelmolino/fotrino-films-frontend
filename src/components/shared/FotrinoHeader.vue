<template>
  <q-header class="bg-primary">
    <q-toolbar>
      <q-toolbar-title>
        <!-- Logo / History Dropdown -->
        <template v-if="history.length === 0">
          <q-btn
            icon="img:/images/logo.png"
            :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
            flat
            no-caps
            size="lg"
            to="/"
          />
        </template>
        <template v-else>
          <q-btn-dropdown
            split
            :icon="showHistory ? 'history' : 'img:/images/logo.png'"
            @before-show="showHistory = true"
            @before-hide="showHistory = false"
            :label="$q.screen.gt.xs ? 'Fotrino Films' : ''"
            to="/"
            flat
            no-caps
            size="lg"
          >
            <div v-for="channel in history" :key="channel.uuid" class="row items-center">
              <q-btn
                icon="fas fa-clapperboard"
                align="left"
                flat
                no-caps
                no-wrap
                class="col-xs-10"
                :label="channel.title"
                size="md"
                :to="`/${channel.uuid}/${channel.slug}`"
              />
              <q-btn
                icon="fas fa-circle-minus"
                flat
                no-caps
                no-wrap
                class="col-xs-2"
                size="md"
                @click="removeHistory(channel.uuid)"
              />
            </div>
            <div v-if="history.length === 0" class="row q-pa-sm">
              No history
            </div>
          </q-btn-dropdown>
        </template>
      </q-toolbar-title>

      <!-- Dark Mode Toggle -->
      <q-toggle
        v-model="darkMode"
        unchecked-icon="far fa-sun"
        checked-icon="far fa-moon"
        color="secondary"
        keep-color
        size="md"
      >
        <q-tooltip>Dark Mode</q-tooltip>
      </q-toggle>

      <!-- Help Button -->
      <q-btn
        icon="fas fa-circle-question"
        :label="$q.screen.gt.sm ? 'Help' : ''"
        flat
        no-caps
        size="md"
        to="/help"
      />

      <!-- Auth / Account Buttons -->
      <template v-if="!profile?.id">
        <q-btn-dropdown icon="fas fa-user" :label="$q.screen.gt.sm ? 'Sign Up/Login' : ''" flat no-caps size="md">
          <template v-for="provider in oauthProviders" :key="provider.name">
            <q-separator />
            <q-btn
              :href="provider.login"
              align="left"
              flat
              no-caps
              :icon="provider.icon"
              :label="provider.name"
              size="md"
              class="fit"
              @click="storeRedirect"
            />
          </template>
        </q-btn-dropdown>
      </template>

      <template v-else>
        <q-btn-dropdown :icon="'img:' + profile.profile_pic" :label="$q.screen.gt.sm ? 'Account' : ''" flat no-caps size="md">
          <q-separator />
          <q-btn to="/account/dashboard" align="left" flat no-caps icon="fas fa-chalkboard" label="Dashboard" size="md" class="fit" />
          <q-separator />
          <q-btn href="/account/upload" align="left" flat no-caps icon="fas fa-cloud-arrow-up" label="Upload Media" size="md" class="fit" />
          <q-separator />
          <q-btn @click="logout" align="left" flat no-caps icon="fas fa-right-from-bracket" label="Logout" size="md" class="fit" />
        </q-btn-dropdown>
      </template>
    </q-toolbar>
  </q-header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useQuasar, LocalStorage } from 'quasar'
import { logout as sharedLogout } from '@javascript/library.js'
const $q = useQuasar()

const store = useStore()
const HISTORY_KEY = 'fotrino-films-history'
const showHistory = ref(false)
const oauthProviders = ref([
  { name: 'Google', icon: 'fab fa-google', login: process.env.API + '/account/login/google' }
])

const profile = computed(() => store.state.account.profile)
const history = ref(LocalStorage.getItem(HISTORY_KEY) || [])

onMounted(() => {
})

watch(
  () => store.state.channel.channel,
  (newChannel) => {
    if (newChannel && newChannel.uuid && newChannel.title && newChannel.slug) {
      addHistory(newChannel)
    }
  },
  { immediate: true }
)

function logout() {
  sharedLogout(store)
}

function addHistory(channel) {
  const current = LocalStorage.getItem(HISTORY_KEY) || []
  if (!current.some(c => c.uuid === channel.uuid)) {
    const updated = [...current, { uuid: channel.uuid, title: channel.title, slug: channel.slug }]
    LocalStorage.set(HISTORY_KEY, updated)
    history.value = updated
  }
}

function removeHistory(uuid) {
  const current = LocalStorage.getItem(HISTORY_KEY) || []
  const updated = current.filter(u => u.uuid !== uuid)
  LocalStorage.set(HISTORY_KEY, updated)
  history.value = updated
}

const darkMode = computed({
  get: () => $q.dark.isActive,
  set: (value) => $q.dark.set(value)
})

function storeRedirect() {
  LocalStorage.set('postLoginRedirect', window.location.pathname)
}
</script>
