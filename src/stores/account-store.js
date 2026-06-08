import { computed, toValue } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { API_CACHE_LONG_MS, API_CACHE_SHORT_MS } from 'src/stores/utils/cache-timeouts.js'
import {
  createApiGetQueryOptionsFactory,
  invalidateQueriesSafely
} from 'src/stores/utils/query-helpers.js'
import { api } from 'src/clients/axios-client.js'
import { mutationResult, runMutation } from 'src/stores/utils/store-mutations.js'

export const useAccountStore = defineStore('account', () => {
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

  const profileQuery = useQuery(() => ({
    ...accountProfileQueryOptions(),
    enabled: false
  }))

  const profile = computed(() => profileQuery.data.value ?? null)

  const setProfile = value => {
    queryCache.setQueryData(accountProfileQueryOptions().key, value)
  }

  const clearProfileCache = () => {
    invalidateQueriesSafely(queryCache, {
      key: accountProfileQueryOptions().key,
      exact: true
    })
  }

  const fetchProfile = async () => {
    const state = await profileQuery.refresh()

    if (state?.status === 'error') {
      setProfile(null)
      return null
    }

    return profile.value
  }

  const useProvidersQuery = (enabled = true, staleTime = API_CACHE_LONG_MS) => {
    return useQuery(() => ({
      ...accountProvidersQueryOptions(staleTime),
      enabled: toValue(enabled)
    }))
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
    setProfile,
    clearProfileCache,
    fetchProfile,
    useProvidersQuery,
    accountProfileQueryOptions,
    accountProvidersQueryOptions,
    logout
  }
})
