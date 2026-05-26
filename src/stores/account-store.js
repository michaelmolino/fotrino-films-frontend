import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { api } from 'src/clients/axios-client.js'
import { API_CACHE_LONG_MS, API_CACHE_SHORT_MS } from 'src/stores/utils/cache-timeouts.js'

export const useAccountStore = defineStore('account', () => {
  const profile = ref(null)
  const providers = ref([])
  const providersLoadFailed = ref(false)
  const queryCache = useQueryCache()

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
      throw error
    }
  }

  const mutationResult = ({ ok, data = null, cancelled = false }) => ({
    ok,
    data,
    cancelled
  })

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

  const invalidateQueries = options => {
    queryCache.invalidateQueries(options).catch(() => {})
  }

  const clearProfileCache = () => {
    invalidateQueries({
      key: accountProfileQueryOptions().key,
      exact: true
    })
  }

  const useProfileQuery = (staleTime = API_CACHE_SHORT_MS) => {
    const query = useQuery(() => accountProfileQueryOptions(staleTime))

    watch(
      () => query.data.value,
      value => {
        setProfile(value ?? null)
      },
      { immediate: true }
    )

    watch(
      () => query.error.value,
      error => {
        if (error) {
          setProfile(null)
        }
      },
      { immediate: true }
    )

    return query
  }

  const useProvidersQuery = (staleTime = API_CACHE_LONG_MS) => {
    const query = useQuery(() => accountProvidersQueryOptions(staleTime))

    watch(
      () => query.data.value,
      value => {
        providersLoadFailed.value = false
        setProviders(value)
      },
      { immediate: true }
    )

    watch(
      () => query.error.value,
      error => {
        if (error) {
          providersLoadFailed.value = true
          setProviders([])
        }
      },
      { immediate: true }
    )

    return query
  }

  const logout = async () => {
    await runStoreMutation({
      request: () => api.post('/account/logout'),
      onSuccess: () => {
        clearProfileCache()
        setProfile(null)
      }
    })
    return mutationResult({ ok: true })
  }

  return {
    profile,
    providers,
    providersLoadFailed,
    setProfile,
    setProviders,
    clearProfileCache,
    useProfileQuery,
    useProvidersQuery,
    accountProfileQueryOptions,
    accountProvidersQueryOptions,
    logout
  }
})
