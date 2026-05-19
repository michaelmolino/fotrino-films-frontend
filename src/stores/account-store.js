import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { api } from 'boot/axios'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'
import { API_CACHE_LONG_MS, API_CACHE_SHORT_MS } from 'src/stores/utils/cache-timeouts.js'

const PROFILE_CACHE_TIMEOUT_MS = API_CACHE_SHORT_MS
const PROVIDERS_CACHE_TIMEOUT_MS = API_CACHE_LONG_MS

const accountProfileQueryOptions = (staleTime = PROFILE_CACHE_TIMEOUT_MS) => ({
    key: ['account', 'profile'],
    staleTime
})

const accountProvidersQueryOptions = (staleTime = PROVIDERS_CACHE_TIMEOUT_MS) => ({
    key: ['account', 'providers'],
    staleTime
})

export const useAccountStore = defineStore('account', () => {
    const profile = ref(null)
    const providers = ref([])
    const queryCache = useQueryCache()

    const setProfile = value => {
        profile.value = value
    }

    const setProviders = value => {
        providers.value = value
    }

    const clearProfileCache = () => {
        queryCache.setQueryData(accountProfileQueryOptions().key, null)
    }

    const loadProfile = (timeout = PROFILE_CACHE_TIMEOUT_MS) => fetchAndApplyGet({
        api,
        url: '/account/profile',
        apply: setProfile,
        cache: {
            queryOptions: accountProfileQueryOptions(timeout),
            queryCache
        },
        onError: error => {
            getGlobalApiErrorPayload(error)
        }
    })

    const loadProviders = async (timeout = PROVIDERS_CACHE_TIMEOUT_MS) => {
        return fetchAndApplyGet({
            api,
            url: '/account/providers',
            apply: setProviders,
            extract: data => data.providers,
            onError: error => {
                getGlobalApiErrorPayload(error)
            },
            cache: {
                queryOptions: accountProvidersQueryOptions(timeout),
                queryCache
            }
        })
    }

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
