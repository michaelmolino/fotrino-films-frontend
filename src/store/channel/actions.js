import { api, objectApi } from 'boot/axios'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'

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
    getGlobalApiErrorPayload(error)
    throw error
  }
}

async function requestUploadInstruction(url) {
  const res = await api.post(
    url,
    null,
    {
      __skipGlobalErrorNotify: true
    }
  )
  return res.data
}

async function confirmUploadInstruction(url, objectName) {
  await api.put(
    url,
    {
      objectName
    },
    {
      __skipGlobalErrorNotify: true
    }
  )
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
    await api.delete(url, {
      __skipGlobalErrorNotify: true
    })
  } catch (error) {
    if (error?.__userCancelled) {
      return false
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
      __skipGlobalErrorNotify: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })
    context.commit('SET_UPLOAD', data)
    return data
  } catch (error) {
    context.commit('SET_UPLOAD', null)
    getGlobalApiErrorPayload(error)
    throw error
  }
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {number} media
 * @returns {Promise<any>}
 */
export function confirmUpload(_, media) {
  return api.put(`/channels/media/confirm/${media}`, null, {
    __skipGlobalErrorNotify: true
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ mediaId: number, description?: string | null, resourceDate?: string | null, main: boolean }} payload
 * @returns {Promise<import('src/types/api-contract').ChannelMedia>}
 */
export async function updateMedia(_, { mediaId, description = null, resourceDate = null, main }) {
  try {
    const res = await api.put(
      `/channels/media/${mediaId}`,
      {
        description: description?.trim() || null,
        resourceDate: resourceDate?.trim() || null,
        main
      },
      {
        __skipGlobalErrorNotify: true
      }
    )
    return res.data
  } catch (error) {
    getGlobalApiErrorPayload(error)
    throw error
  }
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ projectId: number, subtitle?: string | null, posterType: 'default' | 'new', posterColor?: string | null }} payload
 * @returns {Promise<import('src/types/api-contract').ChannelProject>}
 */
export async function updateProject(_, { projectId, subtitle = null, posterType, posterColor = null }) {
  try {
    const res = await api.put(
      `/channels/project/${projectId}`,
      {
        subtitle: subtitle?.trim() || null,
        posterType,
        posterColor
      },
      {
        __skipGlobalErrorNotify: true
      }
    )
    return res.data
  } catch (error) {
    getGlobalApiErrorPayload(error)
    throw error
  }
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ channelUuid: string, title: string }} payload
 * @returns {Promise<import('src/types/api-contract').ChannelSummary>}
 */
export async function updateChannel(_, { channelUuid, title }) {
  try {
    const res = await api.put(
      `/channels/${channelUuid}`,
      {
        title: title?.trim()
      },
      {
        __skipGlobalErrorNotify: true
      }
    )
    return res.data
  } catch (error) {
    getGlobalApiErrorPayload(error)
    throw error
  }
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ mediaId: number }} payload
 * @returns {Promise<import('src/types/api-contract').UploadInstruction & { objectName: string }}
 */
export async function requestMediaPreviewUpload(_, { mediaId }) {
  return requestUploadInstruction(`/channels/media/${mediaId}/preview`)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ projectId: number }} payload
 * @returns {Promise<import('src/types/api-contract').UploadInstruction & { objectName: string }}
 */
export async function requestProjectPosterUpload(_, { projectId }) {
  return requestUploadInstruction(`/channels/project/${projectId}/poster`)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ channelUuid: string }} payload
 * @returns {Promise<import('src/types/api-contract').UploadInstruction & { objectName: string }}
 */
export async function requestChannelCoverUpload(_, { channelUuid }) {
  return requestUploadInstruction(`/channels/${channelUuid}/cover`)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ mediaId: number, objectName: string }} payload
 * @returns {Promise<void>}
 */
export async function confirmMediaPreviewUpload(_, { mediaId, objectName }) {
  await confirmUploadInstruction(`/channels/media/${mediaId}/preview/confirm`, objectName)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ projectId: number, objectName: string }} payload
 * @returns {Promise<void>}
 */
export async function confirmProjectPosterUpload(_, { projectId, objectName }) {
  await confirmUploadInstruction(`/channels/project/${projectId}/poster/confirm`, objectName)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ channelUuid: string, objectName: string }} payload
 * @returns {Promise<void>}
 */
export async function confirmChannelCoverUpload(_, { channelUuid, objectName }) {
  await confirmUploadInstruction(`/channels/${channelUuid}/cover/confirm`, objectName)
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ url: string, file: File | Blob }} payload
 * @returns {Promise<void>}
 */
export async function uploadMediaPreviewBinary(_, { url, file }) {
  await objectApi.put(url, file, {
    headers: {
      'Content-Type': file?.type || 'image/jpeg'
    }
  })
}

/**
 * @param {import('vuex').ActionContext<any, any>} _
 * @param {{ privateId: string, reason?: string | null }} payload
 * @returns {Promise<import('src/types/api-contract').ReportMediaResponse>}
 */
export async function reportMedia(_, { privateId, reason }) {
  const res = await api.post(
    `/channels/media/private/${privateId}/report`,
    {
      reason: reason?.trim() || null
    },
    {
      __skipGlobalErrorNotify: true
    }
  )
  return res.data
}
