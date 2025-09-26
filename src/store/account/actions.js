import { api } from 'boot/axios'

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

export function getProfile(context) {
  return fetchAndCommit(context, {
    url: '/account/profile',
    mutation: 'SET_PROFILE'
  })
}

export function getToken(context) {
  return fetchAndCommit(context, {
    url: '/account/token',
    mutation: 'SET_TOKEN',
    extract: data => data.token
  })
}

export function getCommentboxToken(context) {
  return fetchAndCommit(context, {
    url: '/sso/commentbox',
    mutation: 'SET_COMMENTBOX'
  })
}
