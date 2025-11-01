<template>
  <q-btn-dropdown
    icon="fas fa-user"
    :label="$q.screen.gt.sm ? 'Sign Up/Login' : ''"
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
          :icon="provider.icon"
          :label="provider.name"
          size="md"
          class="col-xs-12"
          @click="storeRedirect" />
      </div>
    </template>
  </q-btn-dropdown>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useQuasar } from 'quasar'
import { storeRedirect } from '@utils/auth.js'

const $q = useQuasar()
const store = useStore()
const oauthProviders = ref([])

onMounted(async () => {
  const providers = await store.cache.dispatch('account/getProviders')
  store.commit('account/SET_PROVIDERS', providers)
  const providerMap = {
    google: {
      name: 'Google',
      icon: 'fab fa-google',
      login: process.env.API + '/account/login/google'
    },
    microsoft: {
      name: 'Microsoft',
      icon: 'fab fa-microsoft',
      login: process.env.API + '/account/login/microsoft'
    },
    apple: { name: 'Apple', icon: 'fab fa-apple', login: process.env.API + '/account/login/apple' },
    facebook: {
      name: 'Facebook',
      icon: 'fab fa-facebook',
      login: process.env.API + '/account/login/facebook'
    },
    github: {
      name: 'Github',
      icon: 'fab fa-github',
      login: process.env.API + '/account/login/github'
    },
    yahoo: { name: 'Yahoo', icon: 'fab fa-yahoo', login: process.env.API + '/account/login/yahoo' }
  }
  oauthProviders.value = providers.map(p => providerMap[p]).filter(Boolean)
})
</script>
