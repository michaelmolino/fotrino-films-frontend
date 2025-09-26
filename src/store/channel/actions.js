import { api } from 'boot/axios'

// Helpers

function sortByDateDesc(items) {
  return [...(items || [])].sort(
    (a, b) => new Date(b.resource_date) - new Date(a.resource_date)
  )
}

function sortChannel(channel) {
  if (!channel) return channel
  const projects = sortByDateDesc(channel.projects).map(project => ({
    ...project,
    media: sortByDateDesc(project.media)
  }))
  return { ...channel, projects }
}

// Actions

export async function getChannels(context, deep = false) {
  try {
    const { data } = await api.get(deep ? '/channels/deep' : '/channels')
    const channels = sortByDateDesc(data).map(sortChannel)
    context.commit('SET_CHANNELS', channels)
    return channels
  } catch (error) {
    context.commit('SET_CHANNELS', [])
    throw error
  }
}

export async function getChannel(context, { uuid, pending }) {
  try {
    const url = `/channels/${uuid}${pending ? '?pending=true' : ''}`
    const { data } = await api.get(url)
    const channel = sortChannel(data)
    context.commit('SET_CHANNEL', channel)
    return channel
  } catch (error) {
    context.commit('SET_CHANNEL', null)
    throw error
  }
}

export async function getPrivateMedia(context, privateId) {
  try {
    const { data } = await api.get(`/channels/media/private/${privateId}`)
    context.commit('SET_CHANNEL', data || null)
    return data || null
  } catch (error) {
    context.commit('SET_CHANNEL', null)
    throw error
  }
}

export async function deleteResource(context, resource) {
  const url = resource.type === 'channel'
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
  const channels = context.state.channels
    .map(channel => {
      if (resource.type === 'channel' && channel.uuid === resource.id) {
        return null
      }
      const projects = (channel.projects || [])
        .map(project => {
          if (resource.type === 'project' && project.id === resource.id) {
            return null
          }
          const media = (project.media || []).filter(
            m => !(resource.type === 'media' && m.id === resource.id)
          )
          return { ...project, media }
        })
        .filter(Boolean)
      return { ...channel, projects }
    })
    .filter(Boolean)
  context.commit('SET_CHANNELS', channels)
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
