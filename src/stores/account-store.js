import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { API_CACHE_LONG_MS, API_CACHE_SHORT_MS } from 'src/stores/utils/cache-timeouts.js'

const PROFILE_CACHE_TIMEOUT_MS = API_CACHE_SHORT_MS
const PROVIDERS_CACHE_TIMEOUT_MS = API_CACHE_LONG_MS

export const useAccountStore = defineStore('account', () => {
  const profile = ref(null)
  const providers = ref([])
  const queryCache = useQueryCache()

  const accountProfileQueryOptions = (staleTime = PROFILE_CACHE_TIMEOUT_MS) => ({
    key: ['account', 'profile'],
    staleTime,
    query: async () => {
      const { data } = await api.get('/account/profile')
      return data
    }
  })

  const accountProvidersQueryOptions = (staleTime = PROVIDERS_CACHE_TIMEOUT_MS) => ({
    key: ['account', 'providers'],
    staleTime,
    query: async () => {
      const { data } = await api.get('/account/providers')
      return data.providers
    }
  })

  const runAccountQuery = async ({ options, apply, onError }) => {
    const entry = queryCache.ensure(options)

    try {
      const state = await queryCache.refresh(entry, options)
      if (state?.status === 'error') {
        throw state.error || new Error('Account query failed')
      }
      const value = state?.data ?? null
      apply(value)
      return value
    } catch (error) {
      apply(null)
      if (typeof onError === 'function') {
        const maybe = onError(error)
        if (maybe !== undefined) {
          return maybe
        }
      }
      throw error
    }
  }

  const setProfile = value => {
    profile.value = value
  }

  const setProviders = value => {
    providers.value = value
  }

  const clearProfileCache = () => {
    void queryCache.invalidateQueries({
      key: accountProfileQueryOptions().key,
      exact: true
    })
  }

  const loadProfile = (timeout = PROFILE_CACHE_TIMEOUT_MS) =>
    runAccountQuery({
      options: accountProfileQueryOptions(timeout),
      apply: setProfile,
      onError: error => {
        getGlobalApiErrorPayload(error)
      }
    })

  const loadProviders = (timeout = PROVIDERS_CACHE_TIMEOUT_MS) =>
    runAccountQuery({
      options: accountProvidersQueryOptions(timeout),
      apply: setProviders,
      onError: error => {
        getGlobalApiErrorPayload(error)
      }
    })

  const logout = async () => {
    await api.post('/account/logout')
    clearProfileCache()
    setProfile(null)
    return true
  }

  return {
    profile,
    providers,
    setProfile,
    setProviders,
    clearProfileCache,
    loadProfile,
    loadProviders,
    logout
  }
})
