<template>
  <q-btn-dropdown
    icon="account_circle"
    :label="buttonLabel"
    aria-label="Sign up or login to your account"
    flat
    no-caps
    size="md">
    <q-tooltip v-if="showTooltip">Sign In</q-tooltip>
    <div v-if="accountStore.providersLoadFailed" class="text-caption text-warning q-px-md q-py-sm">
      Login providers are temporarily unavailable. Please refresh and try again in a moment.
    </div>
    <template v-for="provider in oauthProviders" :key="provider.name">
      <div class="provider-row row">
        <q-btn
          :href="provider.login"
          align="left"
          flat
          no-caps
          :aria-label="`Sign in with ${provider.name}`"
          size="md"
          class="col-xs-12">
          <q-icon :name="provider.icon" :class="provider.iconClass" />
          {{ provider.name }}
        </q-btn>
      </div>
    </template>
  </q-btn-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountStore } from 'src/stores/account-store.js'
import { useQuasar } from 'quasar'
import googleIcon from '@assets/icons/google.svg'
import microsoftIcon from '@assets/icons/microsoft.svg'
import facebookIcon from '@assets/icons/facebook.svg'
import githubIcon from '@assets/icons/github.svg'
import appleIcon from '@assets/icons/apple.svg'
import yahooIcon from '@assets/icons/yahoo.svg'

const $q = useQuasar()
const accountStore = useAccountStore()
const route = useRoute()
const shouldLoadProviders = computed(() => accountStore.profileResolved && !accountStore.profile)
accountStore.useProvidersQuery(shouldLoadProviders)

const buttonLabel = computed(() => ($q.screen.gt.sm ? 'Sign Up/Login' : ''))
const showTooltip = computed(() => !$q.screen.gt.sm)
const oauthIconClass = computed(() => ($q.dark.isActive ? 'oauth-icon--white q-mr-md' : 'q-mr-md'))

const providerMap = {
  google: {
    name: 'Google',
    icon: `img:${googleIcon}`
  },
  microsoft: {
    name: 'Microsoft',
    icon: `img:${microsoftIcon}`
  },
  apple: {
    name: 'Apple',
    icon: `img:${appleIcon}`
  },
  facebook: {
    name: 'Facebook',
    icon: `img:${facebookIcon}`
  },
  github: {
    name: 'Github',
    icon: `img:${githubIcon}`
  },
  yahoo: {
    name: 'Yahoo',
    icon: `img:${yahooIcon}`
  }
}

function getProviderLoginHref(providerKey) {
  const returnTo = route.fullPath || '/'
  return `${process.env.API}/account/login/${providerKey}?redirect_to=${encodeURIComponent(returnTo)}`
}

const oauthProviders = computed(() => {
  return (accountStore.providers || [])
    .map(providerKey => {
      const base = providerMap[providerKey]
      if (!base) return null
      return {
        ...base,
        login: getProviderLoginHref(providerKey),
        iconClass: oauthIconClass.value
      }
    })
    .filter(Boolean)
})
</script>

<style scoped>
.provider-row {
  max-width: 220px;
  margin: 0 auto;
  width: 100%;
}

:deep(.oauth-icon--white) {
  filter: invert(1) brightness(1.2);
}
</style>
