import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { API_CACHE_LONG_MS, API_CACHE_SHORT_MS } from 'src/stores/utils/cache-timeouts.js'

export const useAccountStore = defineStore('account', () => {
  const profile = ref(null)
  const providers = ref([])
  const providersLoadFailed = ref(false)
  const queryCache = useQueryCache()

  const runStoreQuery = async ({ options, apply, onError }) => {
    const entry = queryCache.ensure(options)

    try {
      const state = await queryCache.refresh(entry, options)
      if (state?.status === 'error') {
        throw state.error || new Error('Account query failed')
      }
      const value = state?.data ?? null
      if (typeof apply === 'function') {
        apply(value)
      }
      return value
    } catch (error) {
      if (typeof apply === 'function') {
        apply(null)
      }
      if (typeof onError === 'function') {
        const maybe = onError(error)
        if (maybe !== undefined) {
          return maybe
        }
      }
      throw error
    }
  }

  const runStoreMutation = async ({ request, onSuccess, onError }) => {
    try {
      const result = await request()
      if (typeof onSuccess === 'function') {
        await onSuccess(result)
      }
      return result
    } catch (error) {
      if (typeof onError === 'function') {
        const maybe = onError(error)
        if (maybe !== undefined) {
          return maybe
        }
      }
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const accountProfileQueryOptions = (staleTime = API_CACHE_SHORT_MS) => ({
    key: ['account', 'profile'],
    staleTime,
    query: async () => {
      const { data } = await api.get('/account/profile', {
        __skipGlobalErrorNotify: true
      })
      return data
    }
  })

  const accountProvidersQueryOptions = (staleTime = API_CACHE_LONG_MS) => ({
    key: ['account', 'providers'],
    staleTime,
    query: async () => {
      const { data } = await api.get('/account/providers', {
        __skipGlobalErrorNotify: true
      })
      return data.providers
    }
  })

  const setProfile = value => {
    profile.value = value
  }

  const setProviders = value => {
    providers.value = Array.isArray(value) ? value : []
  }

  const clearProfileCache = () => {
    void queryCache.invalidateQueries({
      key: accountProfileQueryOptions().key,
      exact: true
    })
  }

  const loadProfile = (timeout = API_CACHE_SHORT_MS) =>
    runStoreQuery({
      options: accountProfileQueryOptions(timeout),
      apply: setProfile,
      onError: error => {
        getGlobalApiErrorPayload(error)
        return null
      }
    })

  const loadProviders = (timeout = API_CACHE_LONG_MS) =>
    runStoreQuery({
      options: accountProvidersQueryOptions(timeout),
      apply: value => {
        providersLoadFailed.value = false
        setProviders(value)
      },
      onError: error => {
        getGlobalApiErrorPayload(error)
        providersLoadFailed.value = true
        return []
      }
    })

  const logout = async () => {
    await runStoreMutation({
      request: () => api.post('/account/logout'),
      onSuccess: () => {
        clearProfileCache()
        setProfile(null)
      }
    })
    return true
  }

  return {
    profile,
    providers,
    providersLoadFailed,
    setProfile,
    setProviders,
    clearProfileCache,
    loadProfile,
    loadProviders,
    logout
  }
})
