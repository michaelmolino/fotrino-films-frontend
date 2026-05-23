<template>
  <q-btn-dropdown
    :icon="'img:' + profile.avatar"
    :label="$q.screen.gt.sm ? 'Account' : ''"
    :aria-label="'Account menu for ' + (profile.name || 'user')"
    data-cy="account-menu"
    flat
    no-caps
    size="md">
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        v-if="profile?.isAdmin"
        to="/admin"
        align="left"
        flat
        no-caps
        icon="verified_user"
        label="Admin"
        aria-label="Go to admin dashboard"
        size="md"
        class="col-xs-12" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        to="/account/dashboard"
        align="left"
        flat
        no-caps
        icon="dashboard"
        label="Dashboard"
        aria-label="Go to account dashboard"
        size="md"
        class="col-xs-12" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        align="left"
        flat
        no-caps
        icon="cloud_upload"
        label="Upload Video"
        aria-label="Upload a video"
        size="md"
        class="col-xs-12"
        @click="goToUpload" />
    </div>
    <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
      <q-btn
        @click="accountStore.logout()"
        align="left"
        flat
        no-caps
        icon="logout"
        label="Logout"
        aria-label="Logout from your account"
        data-cy="account-logout"
        size="md"
        class="col-xs-12" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { useAccountStore } from 'src/stores/account-store.js'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { ref, watch, onMounted } from 'vue'

const $q = useQuasar()
const accountStore = useAccountStore()
const router = useRouter()
const providers = ref([])

async function fetchProviders() {
  providers.value = await accountStore.loadProviders()
}

// Define props explicitly
const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
})

// Watch for changes in the profile prop
watch(
  () => props.profile,
  (newProfile) => {
    if (!newProfile) {
      fetchProviders()
    }
  }
)

// Fetch providers on mount if not logged in
onMounted(() => {
  if (!props.profile) {
    fetchProviders()
  }
})

function goToUpload() {
  router.push({
    path: '/account/upload',
    query: { u: String(Date.now()) }
  })
}

</script>
