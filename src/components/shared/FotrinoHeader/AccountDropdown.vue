<template>
  <q-btn-dropdown
    :icon="'img:' + profile.avatar"
    :label="buttonLabel"
    :aria-label="'Account menu for ' + (profile.name || 'user')"
    data-cy="account-menu"
    flat
    no-caps
    size="md">
    <div v-for="item in menuItems" :key="item.key" class="menu-row row">
      <q-btn
        align="left"
        flat
        no-caps
        :icon="item.icon"
        :label="item.label"
        :aria-label="item.ariaLabel"
        :data-cy="item.dataCy"
        size="md"
        class="col-xs-12"
        :to="item.to"
        @click="item.onClick ? item.onClick() : null" />
    </div>
  </q-btn-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useAccountStore } from 'src/stores/account-store.js'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const accountStore = useAccountStore()
const router = useRouter()

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
})

const buttonLabel = computed(() => ($q.screen.gt.sm ? 'Account' : ''))

const menuItems = computed(() => {
  const items = []

  if (props.profile?.isAdmin) {
    items.push({
      key: 'admin',
      to: '/admin',
      icon: 'verified_user',
      label: 'Admin',
      ariaLabel: 'Go to admin dashboard'
    })
  }

  items.push(
    {
      key: 'dashboard',
      to: '/account/dashboard',
      icon: 'dashboard',
      label: 'Dashboard',
      ariaLabel: 'Go to account dashboard'
    },
    {
      key: 'upload',
      icon: 'cloud_upload',
      label: 'Upload Video',
      ariaLabel: 'Upload a video',
      onClick: goToUpload
    },
    {
      key: 'logout',
      icon: 'logout',
      label: 'Logout',
      ariaLabel: 'Logout from your account',
      dataCy: 'account-logout',
      onClick: () => accountStore.logout()
    }
  )

  return items
})

function goToUpload() {
  router.push({
    path: '/account/upload',
    query: { u: String(Date.now()) }
  })
}
</script>

<style scoped>
.menu-row {
  max-width: 220px;
  margin: 0 auto;
  width: 100%;
}
</style>
