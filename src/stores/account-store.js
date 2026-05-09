import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { api } from 'boot/axios'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'

const DEFAULT_CACHE_TIMEOUT = 3600000

const accountProvidersQuery = (staleTime = DEFAULT_CACHE_TIMEOUT) => ({
    key: ['account', 'providers'],
    staleTime
})

export const useAccountStore = defineStore('account', () => {
    const profile = ref(null)
    const providers = ref([])
    const queryCache = useQueryCache()

    const setProfile = nextProfile => {
        profile.value = nextProfile
    }

    const setProviders = nextProviders => {
        providers.value = nextProviders
    }

    const getProfile = () => fetchAndApplyGet({
        api,
        url: '/account/profile',
        apply: setProfile,
        onError: error => {
            getGlobalApiErrorPayload(error)
        }
    })

    const getProviders = async (timeout = DEFAULT_CACHE_TIMEOUT) => {
        return fetchAndApplyGet({
            api,
            url: '/account/providers',
            apply: setProviders,
            extract: data => data.providers,
            onError: error => {
                getGlobalApiErrorPayload(error)
            },
            cache: {
                queryOptions: accountProvidersQuery(timeout),
                queryCache
            }
        })
    }

    const logout = async () => {
        await api.get('/account/logout')
        setProfile(null)
        return true
    }

    return {
        profile,
        providers,
        setProfile,
        setProviders,
        getProfile,
        getProviders,
        logout
    }
})
