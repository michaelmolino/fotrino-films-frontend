import { api } from 'boot/axios'

// Helpers

async function fetchAndCommit(context, { url, mutation, extract }) {
  try {
    const { data } = await api.get(url)
    const value = extract ? extract(data) : data
    context.commit(mutation, value)
    return value
  } catch (error) {
    context.commit(mutation, null)
    throw error
  }
}

// Actions

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @returns {Promise<import('src/types/api-contract').AccountProfile | null>}
 */
export function getProfile(context) {
  return fetchAndCommit(context, {
    url: '/account/profile',
    mutation: 'SET_PROFILE'
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @returns {Promise<import('src/types/api-contract').OAuthProvider[]>}
 */
export function getProviders(context) {
  return fetchAndCommit(context, {
    url: '/account/providers',
    mutation: 'SET_PROVIDERS',
    /** @param {import('src/types/api-contract').AccountProvidersResponse} data */
    extract: data => data.providers
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @returns {Promise<boolean>}
 */
export async function logout(context) {
  await api.get('/account/logout')
  context.commit('SET_PROFILE', null)
  return true
}
