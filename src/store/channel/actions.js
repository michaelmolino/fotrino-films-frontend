import { api } from 'boot/axios'

// Helpers

function sortBy(items, field, direction = 'desc') {
  return [...(items || [])].sort((a, b) => {
    const aValue = a[field]
    const bValue = b[field]

    // Handle null/undefined values
    if (!aValue && !bValue) return 0
    if (!aValue) return direction === 'desc' ? 1 : -1
    if (!bValue) return direction === 'desc' ? -1 : 1

    // Check if values are dates by trying to parse them
    const aDate = new Date(aValue)
    const bDate = new Date(bValue)
    const aIsValidDate = !isNaN(aDate.getTime())
    const bIsValidDate = !isNaN(bDate.getTime())

    // Sort dates
    if (aIsValidDate && bIsValidDate) {
      return direction === 'desc' ? bDate - aDate : aDate - bDate
    }

    // Sort strings/numbers
    if (direction === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    }
  })
}

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

export async function deleteResource(context, resource) {
  const url =
    resource.type === 'channel'
      ? `/channels/${resource.id}`
      : `/channels/${resource.type}/${resource.id}`

  try {
    await api.delete(url)
  } catch (error) {
    // Ignore user-cancelled deletes
    if (error && error.message === 'User cancelled delete') {
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
