import { api } from 'boot/axios'

// Helpers

function sortByDateDesc(items) {
  return [...(items || [])].sort((a, b) => new Date(b.resource_date || b.updated) - new Date(a.resource_date || a.updated))
}

function sortChannel(channel) {
  if (!channel) return channel
  const projects = sortByDateDesc(channel.projects).map(project => ({
    ...project,
    media: sortByDateDesc(project.media)
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
    extract: data => sortByDateDesc(data).map(sortChannel)
  })
}

export function getChannel(context, { uuid, pending }) {
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
  // Refresh channels from backend
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
