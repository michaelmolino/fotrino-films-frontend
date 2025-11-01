import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'

// Helpers

function sortChannel(channel) {
  if (!channel) return channel
  const projects = sortBy(channel.projects, 'resource_date', 'desc').map(project => ({
    ...project,
    media: sortBy(project.media, 'resource_date', 'desc')
  }))
  return { ...channel, projects }
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

export function getChannels(context, deep = false) {
  return fetchAndCommit(context, {
    url: deep ? '/channels/deep' : '/channels',
    mutation: 'SET_CHANNELS',
    extract: data => sortBy(data, 'title', 'desc').map(sortChannel)
  })
}

export function getChannel(context, { uuid, pending = false }) {
  const url = `/channels/${uuid}${pending ? '?pending=true' : ''}`
  return fetchAndCommit(context, {
    url,
    mutation: 'SET_CHANNEL',
    extract: sortChannel
  })
}

export function getPrivateMedia(context, privateId) {
  return fetchAndCommit(context, {
    url: `/channels/media/private/${privateId}`,
    mutation: 'SET_CHANNEL'
  })
}

export function getMediaToken(context, privateId) {
  return fetchAndCommit(context, {
    url: `/channels/media/token/${privateId}`,
    mutation: 'SET_MEDIA_TOKEN',
    extract: data => data.token
  })
}

export async function deleteResource(context, resource) {
  const url =
    resource.type === 'channel'
      ? `/channels/${resource.id}`
      : `/channels/${resource.type}/${resource.id}`

  try {
    await api.delete(url)
  } catch (error) {
    // Ignore user-cancelled deletes
    if (error?.message === 'User cancelled delete') {
      return
    }
    throw error
  }
  // Refresh channels from backend - clear first to ensure reactivity
  context.commit('SET_CHANNELS', [])
  await getChannels(context, true)
}

export async function postUpload(context, payload) {
  try {
    const { data } = await api.post('/channels/media', payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })
    context.commit('SET_UPLOAD', data)
    return data
  } catch (error) {
    context.commit('SET_UPLOAD', null)
    throw error
  }
}

export function confirmUpload(_, media) {
  return api.put(`/channels/media/${media}`)
}

export async function reportMedia(_, { privateId, reason }) {
  const res = await api.post(`/channels/media/private/${privateId}/report`, {
    reason: reason?.trim() || null
  })
  return res.data
}
