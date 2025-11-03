<template>
  <q-btn-dropdown
    icon="account_circle"
    :label="$q.screen.gt.sm ? 'Sign Up/Login' : ''"
    aria-label="Sign up or login to your account"
    flat
    no-caps
    size="md">
    <template v-for="provider in oauthProviders" :key="provider.name">
      <div style="max-width: 220px; margin: 0 auto; width: 100%" class="row">
        <q-btn
          :href="provider.login"
          align="left"
          flat
          no-caps
          :aria-label="`Sign in with ${provider.name}`"
          size="md"
          class="col-xs-12"
          @click="storeRedirect"
        >
          <q-icon :name="provider.icon" :class="$q.dark.isActive ? 'oauth-icon--white q-mr-md' : 'q-mr-md'" /> {{  provider.name }}
        </q-btn>
      </div>
    </template>
  </q-btn-dropdown>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useQuasar } from 'quasar'
import { storeRedirect } from '@utils/auth.js'
import googleIcon from '@assets/icons/google.svg'
import microsoftIcon from '@assets/icons/microsoft.svg'
import facebookIcon from '@assets/icons/facebook.svg'
import githubIcon from '@assets/icons/github.svg'
import appleIcon from '@assets/icons/apple.svg'
import yahooIcon from '@assets/icons/yahoo.svg'

const $q = useQuasar()
const store = useStore()
const oauthProviders = ref([])

onMounted(async () => {
  const providers = await store.cache.dispatch('account/getProviders')
  store.commit('account/SET_PROVIDERS', providers)
  const providerMap = {
    google: {
      name: 'Google',
      icon: `img:${googleIcon}`,
      login: process.env.API + '/account/login/google'
    },
    microsoft: {
      name: 'Microsoft',
      icon: `img:${microsoftIcon}`,
      login: process.env.API + '/account/login/microsoft'
    },
    apple: {
      name: 'Apple',
      icon: `img:${appleIcon}`,
      login: process.env.API + '/account/login/apple'
    },
    facebook: {
      name: 'Facebook',
      icon: `img:${facebookIcon}`,
      login: process.env.API + '/account/login/facebook'
    },
    github: {
      name: 'Github',
      icon: `img:${githubIcon}`,
      login: process.env.API + '/account/login/github'
    },
    yahoo: {
      name: 'Yahoo',
      icon: `img:${yahooIcon}`,
      login: process.env.API + '/account/login/yahoo'
    }
  }
  oauthProviders.value = providers.map(p => providerMap[p]).filter(Boolean)
})
</script>

<style scoped>
:deep(.oauth-icon--white) {
  filter: invert(1) brightness(1.2);
}
</style>
