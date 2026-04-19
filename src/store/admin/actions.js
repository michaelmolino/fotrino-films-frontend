import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'

// Helpers

/**
 * @param {import('src/types/api-contract').AdminUser[]} users
 * @returns {import('src/types/api-contract').AdminUser[]}
 */
function sortUsers(users) {
  const sortedUsers = sortBy(users, 'last_login', 'desc')
  for (const user of sortedUsers) {
    if (Array.isArray(user.channels)) {
      user.channels = sortBy(user.channels, 'created', 'desc')
    }
  }
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
    // Handle forbidden (403) gracefully
    if (error?.response?.status === 403) {
      return null
    }
    // For all other errors, rethrow
    throw error
  }
}

// Actions

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @returns {Promise<import('src/types/api-contract').AdminUser[] | null>}
 */
export function getAllUsers(context) {
  return fetchAndCommit(context, {
    url: '/admin/users',
    mutation: 'SET_USERS',
    /** @param {import('src/types/api-contract').AdminUsersResponse} data */
    extract: data => sortUsers(data.users)
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @returns {Promise<import('src/types/api-contract').DeadLetterQueueItem[] | null>}
 */
export function getDLQ(context) {
  return fetchAndCommit(context, {
    url: '/admin/outbox/dlq',
    mutation: 'SET_OUTBOX_DLQ'
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {number} eventId
 * @returns {Promise<import('src/types/api-contract').RequeueOutboxResponse>}
 */
export async function requeueDLQItem(context, eventId) {
  const { data } = await api.post(`/admin/outbox/requeue/${eventId}`)
  await getDLQ(context)
  return data
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {number} userId
 * @returns {Promise<void>}
 */
export async function deleteUser(context, userId) {
  try {
    await api.delete(`/admin/users/${userId}`)
  } catch (error) {
    //Ignore user-cancelled deletes
    if (error?.message === 'User cancelled delete') {
      return
    }
    throw error
  }
  // Refresh users from backend - clear first to ensure reactivity
  context.commit('SET_USERS', [])
  await getAllUsers(context)
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @returns {Promise<import('src/types/api-contract').ReportedMediaItem[] | null>}
 */
export function getReportedMedia(context) {
  return fetchAndCommit(context, {
    url: '/admin/media/reported',
    mutation: 'SET_REPORTED_MEDIA'
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {string} privateId
 * @returns {Promise<void>}
 */
export async function deleteMedia(context, privateId) {
  try {
    await api.delete(`/admin/media/${privateId}`)
  } catch (error) {
    if (error?.__userCancelled) {
      return
    }
    throw error
  }
  // Refresh reported media list
  context.commit('SET_REPORTED_MEDIA', [])
  await getReportedMedia(context)
}
