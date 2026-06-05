import { ref, toValue, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { API_CACHE_LONG_MS, API_CACHE_SHORT_MS } from 'src/stores/utils/cache-timeouts.js'
import {
  createApiGetQueryOptionsFactory,
  invalidateQueriesSafely,
  toArray
} from 'src/stores/utils/query-helpers.js'
import { api } from 'src/clients/axios-client.js'
import { mutationResult, runMutation } from 'src/stores/utils/store-mutations.js'

export const useAccountStore = defineStore('account', () => {
  const profile = ref(null)
  const providers = ref([])
  const providersLoadFailed = ref(false)
  const queryCache = useQueryCache()

  const accountProfileQueryOptions = createApiGetQueryOptionsFactory({
    key: ['account', 'profile'],
    staleTime: (staleTime = API_CACHE_SHORT_MS) => staleTime,
    url: '/account/profile',
    config: {
      __policy: {
        loadHandling: 'none',
        errorHandling: 'none'
      }
    },
    transform: data => data?.data ?? null
  })

  const accountProvidersQueryOptions = createApiGetQueryOptionsFactory({
    key: ['account', 'providers'],
    staleTime: (staleTime = API_CACHE_LONG_MS) => staleTime,
    url: '/account/providers',
    config: {
      __policy: {
        loadHandling: 'none',
        errorHandling: 'none'
      }
    },
    transform: data => data?.data
  })

  const setProfile = value => {
    profile.value = value
  }

  const setProviders = value => {
    providers.value = toArray(value)
  }

  const clearProfileCache = () => {
    invalidateQueriesSafely(queryCache, {
      key: accountProfileQueryOptions().key,
      exact: true
    })
  }

  const fetchProfile = async (staleTime = API_CACHE_SHORT_MS) => {
    const options = accountProfileQueryOptions(staleTime)
    const entry = queryCache.ensure(options)
    const state = await queryCache.fetch(entry, options)

    if (state?.status === 'error') {
      setProfile(null)
      return null
    }

    const value = state?.data ?? null
    setProfile(value)
    return value
  }

  const useProvidersQuery = (enabled = true, staleTime = API_CACHE_LONG_MS) => {
    const query = useQuery(() => ({
      ...accountProvidersQueryOptions(staleTime),
      enabled: toValue(enabled)
    }))

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
          if (providers.value.length === 0) {
            setProviders([])
          }
        }
      },
      { immediate: true }
    )

    return query
  }

  const logout = async () => {
    await runMutation({
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
    fetchProfile,
    useProvidersQuery,
    accountProfileQueryOptions,
    accountProvidersQueryOptions,
    logout
  }
})
