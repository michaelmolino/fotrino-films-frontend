import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'

// Helpers

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
    throw error
  }
}

// Actions

export function getAllUsers(context) {
  return fetchAndCommit(context, {
    url: '/admin/users',
    mutation: 'SET_USERS',
    extract: data => sortUsers(data.users)
  })
}

export function getDLQ(context) {
  return fetchAndCommit(context, {
    url: '/admin/outbox/dlq',
    mutation: 'SET_OUTBOX_DLQ'
  })
}

export async function requeueDLQItem(context, eventId) {
  await api.post(`/admin/outbox/requeue/${eventId}`)
  getDLQ(context)
}

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

export function getReportedMedia(context) {
  return fetchAndCommit(context, {
    url: '/admin/media/reported',
    mutation: 'SET_REPORTED_MEDIA'
  })
}

export async function deleteMedia(context, privateId) {
  await api.delete(`/admin/media/${privateId}`)
  // Refresh reported media list
  context.commit('SET_REPORTED_MEDIA', [])
  await getReportedMedia(context)
}
