<template>
  <div
    class="auth-required-container"
    :class="{ 'auth-required-container--dark': isDark }"
    :data-cy="`auth-required-${props.type}`">
    <q-icon :name="resolved.icon" :size="iconSize" color="grey-5" />
    <div class="text-h6 q-mt-md text-grey-6" data-cy="auth-required-title">
      {{ resolved.title }}
    </div>
    <div class="text-body2 text-grey-7" data-cy="auth-required-message">{{ resolved.message }}</div>
    <div v-if="showLoginProviders" class="auth-provider-list q-mt-md full-width">
      <div v-if="accountStore.providersLoadFailed" class="text-caption text-warning q-mb-sm">
        Login providers are temporarily unavailable. Please refresh and try again in a moment.
      </div>
      <q-btn
        v-for="provider in oauthProviders"
        :key="provider.name"
        class="full-width q-mb-sm auth-provider-btn"
        :class="{ 'auth-provider-btn--dark': isDark }"
        outline
        :color="providerButtonColor"
        :text-color="providerButtonTextColor"
        no-caps
        align="left"
        :href="provider.login"
        :aria-label="`Sign in with ${provider.name}`">
        <q-icon :name="provider.icon" :class="authProviderIconClass" />
        {{ provider.name }}
      </q-btn>
    </div>
    <div class="auth-actions row q-gutter-sm justify-center q-mt-md">
      <q-btn
        v-if="resolved.primaryAction"
        unelevated
        color="primary"
        :label="resolved.primaryAction.label"
        :to="resolved.primaryAction.to"
        :href="resolved.primaryAction.href"
        :target="resolved.primaryAction.target"
        :aria-label="resolved.primaryAction.ariaLabel || resolved.primaryAction.label" />
      <q-btn
        v-if="resolved.secondaryAction"
        flat
        color="primary"
        :label="resolved.secondaryAction.label"
        :to="resolved.secondaryAction.to"
        :href="resolved.secondaryAction.href"
        :target="resolved.secondaryAction.target"
        :aria-label="resolved.secondaryAction.ariaLabel || resolved.secondaryAction.label" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAccountStore } from 'src/stores/account-store.js'
import googleIcon from '@assets/icons/google.svg'
import microsoftIcon from '@assets/icons/microsoft.svg'
import facebookIcon from '@assets/icons/facebook.svg'
import githubIcon from '@assets/icons/github.svg'
import appleIcon from '@assets/icons/apple.svg'
import yahooIcon from '@assets/icons/yahoo.svg'

const props = defineProps({
  type: {
    type: String,
    default: 'login',
    validator: value => ['login', 'admin', 'custom'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconSize: {
    type: String,
    default: '48px'
  },
  primaryAction: {
    type: Object,
    default: null
  },
  secondaryAction: {
    type: Object,
    default: null
  },
  showLoginProviders: {
    type: Boolean,
    default: true
  }
})

const route = useRoute()
const $q = useQuasar()
const accountStore = useAccountStore()
accountStore.useProvidersQuery()
const isDark = computed(() => $q.dark.isActive)
const providerButtonColor = computed(() => (isDark.value ? 'secondary' : 'primary'))
const providerButtonTextColor = computed(() => (isDark.value ? 'white' : 'primary'))
const authProviderIconClass = computed(() =>
  isDark.value ? 'q-mr-sm auth-provider-icon auth-provider-icon--dark' : 'q-mr-sm auth-provider-icon'
)

const providerMap = {
  google: { name: 'Google', icon: `img:${googleIcon}` },
  microsoft: { name: 'Microsoft', icon: `img:${microsoftIcon}` },
  apple: { name: 'Apple', icon: `img:${appleIcon}` },
  facebook: { name: 'Facebook', icon: `img:${facebookIcon}` },
  github: { name: 'GitHub', icon: `img:${githubIcon}` },
  yahoo: { name: 'Yahoo', icon: `img:${yahooIcon}` }
}

function getProviderLoginHref(providerKey) {
  const returnTo = route.fullPath || '/'
  return `${process.env.API}/account/login/${providerKey}?redirect_to=${encodeURIComponent(returnTo)}`
}

const oauthProviders = computed(() => {
  if (props.type !== 'login') return []
  return (accountStore.providers || [])
    .map(providerKey => {
      const base = providerMap[providerKey]
      if (!base) return null
      return {
        ...base,
        login: getProviderLoginHref(providerKey)
      }
    })
    .filter(Boolean)
})

const showLoginProviders = computed(
  () => props.type === 'login' && props.showLoginProviders && oauthProviders.value.length > 0
)

const AUTH_REQUIRED_PRESETS = {
  login: {
    title: 'Authentication Required',
    message: 'Please log in to access this page.',
    icon: 'lock',
    primaryAction: {
      label: 'Go to Home',
      to: '/'
    },
    secondaryAction: null
  },
  admin: {
    title: 'Access Denied',
    message: "You don't have administrator privileges.",
    icon: 'security',
    primaryAction: {
      label: 'Go to Dashboard',
      to: '/account/dashboard'
    },
    secondaryAction: {
      label: 'Go to Home',
      to: '/'
    }
  },
  custom: {
    title: 'Authentication Required',
    message: 'Please log in to access this page.',
    icon: 'lock',
    primaryAction: {
      label: 'Go to Home',
      to: '/'
    },
    secondaryAction: null
  }
}

const resolved = computed(() => {
  const preset = AUTH_REQUIRED_PRESETS[props.type] || AUTH_REQUIRED_PRESETS.login
  return {
    title: props.title || preset.title,
    message: props.message || preset.message,
    icon: props.icon || preset.icon,
    primaryAction: props.primaryAction || preset.primaryAction,
    secondaryAction: props.secondaryAction || preset.secondaryAction
  }
})
</script>

<style scoped>
.auth-required-container {
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 420px;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid rgba(0, 109, 119, 0.22);
  background: #f3f8f8;
}

.auth-required-container--dark {
  border-color: rgba(78, 166, 158, 0.32);
  background: rgba(45, 45, 45, 0.72);
}

.auth-provider-list {
  max-width: 280px;
}

.auth-provider-btn {
  justify-content: flex-start;
  min-height: 42px;
  padding-left: 10px;
  background: rgba(255, 255, 255, 0.45);
}

.auth-provider-btn--dark {
  background: rgba(255, 255, 255, 0.08);
}

.auth-provider-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

:deep(.auth-provider-icon--dark) {
  filter: invert(1) brightness(1.25);
}
</style>
