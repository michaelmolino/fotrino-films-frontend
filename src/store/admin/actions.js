import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'

// Helpers

function sortUsers(users) {
  const sortedUsers = sortBy(users, 'last_login', 'desc')
  sortedUsers.forEach(user => {
    if (Array.isArray(user.channels)) {
      user.channels = sortBy(user.channels, 'created', 'desc')
    }
  })
  return sortedUsers
}

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

export function getAllUsers(context) {
  return fetchAndCommit(context, {
    url: '/admin/all-users',
    mutation: 'SET_USERS',
    extract: data => sortUsers(data.users)
  })
}
