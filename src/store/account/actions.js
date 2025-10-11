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

export function getProfile(context) {
  return fetchAndCommit(context, {
    url: '/account/profile',
    mutation: 'SET_PROFILE'
  })
}

export function getProviders(context) {
  return fetchAndCommit(context, {
    url: '/account/providers',
    mutation: 'SET_PROVIDERS',
    extract: (data) => data.providers
  })
}

export function getCommentboxToken(context) {
  return fetchAndCommit(context, {
    url: '/sso/commentbox',
    mutation: 'SET_COMMENTBOX'
  })
}
