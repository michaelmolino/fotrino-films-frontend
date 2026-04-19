import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'

// Helpers

/**
 * @param {import('src/types/api-contract').ChannelDetail} channel
 * @returns {import('src/types/api-contract').ChannelDetail}
 */
function sortChannelDetail(channel) {
  if (!channel) return channel
  const projects = sortBy(channel.projects, 'resource_date', 'desc').map(project => ({
    ...project,
    media: sortBy(project.media, 'resource_date', 'desc')
  }))
  return { ...channel, projects }
}

/**
 * @param {import('src/types/api-contract').ChannelSummary[] | import('src/types/api-contract').ChannelDetail[]} channels
 * @returns {import('src/types/api-contract').ChannelSummary[] | import('src/types/api-contract').ChannelDetail[]}
 */
function sortChannelsByTitle(channels) {
  return sortBy(channels, 'title', 'desc')
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

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {boolean} [deep=false]
 * @returns {Promise<import('src/types/api-contract').ChannelSummary[] | import('src/types/api-contract').ChannelDetail[]>}
 */
export function getChannels(context, deep = false) {
  return fetchAndCommit(context, {
    url: deep ? '/channels/deep' : '/channels',
    mutation: 'SET_CHANNELS',
    extract: data =>
      deep ? sortChannelsByTitle(data).map(sortChannelDetail) : sortChannelsByTitle(data)
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {{ uuid: string, pending?: boolean }} options
 * @returns {Promise<import('src/types/api-contract').ChannelDetail>}
 */
export function getChannel(context, { uuid, pending = false }) {
  const url = `/channels/${uuid}${pending ? '?pending=true' : ''}`
  return fetchAndCommit(context, {
    url,
    mutation: 'SET_CHANNEL',
    extract: sortChannelDetail
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {string} privateId
 * @returns {Promise<import('src/types/api-contract').PrivateMediaChannel>}
 */
export function getPrivateMedia(context, privateId) {
  return fetchAndCommit(context, {
    url: `/channels/media/private/${privateId}`,
    mutation: 'SET_CHANNEL'
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {string} privateId
 * @returns {Promise<string>}
 */
export function getMediaToken(context, privateId) {
  return fetchAndCommit(context, {
    url: `/channels/media/token/${privateId}`,
    mutation: 'SET_MEDIA_TOKEN',
    /** @param {import('src/types/api-contract').MediaTokenResponse} data */
    extract: data => data.token
  })
}

export async function deleteResource(context, resource) {
  /** @type {import('src/types/api-contract').ChannelResourceRef} */
  const url =
    resource.type === 'channel'
      ? `/channels/${resource.id}`
      : `/channels/${resource.type}/${resource.id}`

  try {
    await api.delete(url)
  } catch (error) {
    if (error?.__userCancelled) {
      return
    }
    throw error
  }
  // Refresh channels from backend - clear first to ensure reactivity
  context.commit('SET_CHANNELS', [])
  await getChannels(context, true)
}

/**
 * @param {import('vuex').ActionContext<any, any>} context
 * @param {import('src/types/api-contract').UploadMediaRequest} payload
 * @returns {Promise<import('src/types/api-contract').UploadInstruction[]>}
 */
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

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {number} media
 * @returns {Promise<any>}
 */
export function confirmUpload(_, media) {
  return api.put(`/channels/media/confirm/${media}`)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ privateId: string, reason?: string | null }} payload
 * @returns {Promise<import('src/types/api-contract').ReportMediaResponse>}
 */
export async function reportMedia(_, { privateId, reason }) {
  const res = await api.post(`/channels/media/private/${privateId}/report`, {
    reason: reason?.trim() || null
  })
  return res.data
}
