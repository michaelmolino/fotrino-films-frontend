import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { useQueryCache } from '@pinia/colada'
import { API_CACHE_MEDIUM_MS } from 'src/stores/utils/cache-timeouts.js'

const CHANNEL_LIST_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS
const CHANNEL_DETAIL_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS
const PRIVATE_MEDIA_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS
const PRIVATE_ALBUM_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])
  const upload = ref(null)

  const queryCache = useQueryCache()

  const setChannels = value => {
    channels.value = value
  }

  const setUpload = value => {
    upload.value = value
  }

  const requestUploadInstruction = async url => {
    const res = await api.post(url, null, {
      __skipGlobalErrorNotify: true
    })
    return res.data
  }

  const channelQueryOptions = (channelId, pending = false) => ({
    key: ['channel', channelId, pending ? 'pending' : 'current'],
    staleTime: CHANNEL_DETAIL_CACHE_TIMEOUT_MS,
    query: async () => {
      const url = `/channels/${channelId}${pending ? '?pending=true' : ''}`
      const { data } = await api.get(url)
      return data
    }
  })

  const channelsQueryOptions = (deep = false) => ({
    key: ['channels', deep ? 'deep' : 'flat'],
    staleTime: CHANNEL_LIST_CACHE_TIMEOUT_MS,
    query: async () => {
      const { data } = await api.get(deep ? '/channels/deep' : '/channels')
      return Array.isArray(data) ? data : []
    }
  })

  const channelByAlbumQueryOptions = albumId => ({
    key: ['channel', 'album', albumId],
    staleTime: CHANNEL_DETAIL_CACHE_TIMEOUT_MS,
    query: async () => {
      const { data } = await api.get(`/channels/album/${albumId}`)
      return data
    }
  })

  const channelByMediaQueryOptions = mediaId => ({
    key: ['channel', 'media', mediaId],
    staleTime: CHANNEL_DETAIL_CACHE_TIMEOUT_MS,
    query: async () => {
      const { data } = await api.get(`/channels/media/${mediaId}`)
      return data
    }
  })

  const privateMediaQueryOptions = privateMediaId => ({
    key: ['channel', 'private-media', privateMediaId],
    staleTime: PRIVATE_MEDIA_CACHE_TIMEOUT_MS,
    query: async () => {
      const { data } = await api.get(`/channels/media/private/${privateMediaId}`)
      return data
    }
  })

  const privateAlbumQueryOptions = (privateAlbumId, privateMediaId = null) => ({
    key: ['channel', 'private-album', privateAlbumId, privateMediaId || 'root'],
    staleTime: PRIVATE_ALBUM_CACHE_TIMEOUT_MS,
    query: async () => {
      const mediaQuery = privateMediaId ? `?mediaPrivateId=${encodeURIComponent(privateMediaId)}` : ''
      const { data } = await api.get(`/channels/album/private/${privateAlbumId}${mediaQuery}`)
      return data
    }
  })

  const invalidateChannelsCache = () => {
    void queryCache.invalidateQueries({
      key: channelsQueryOptions(false).key,
      exact: true
    })
    void queryCache.invalidateQueries({
      key: channelsQueryOptions(true).key,
      exact: true
    })
  }

  const invalidateChannelCacheById = channelId => {
    if (!channelId) return
    void queryCache.invalidateQueries({
      predicate: query =>
        query.key?.[0] === 'channel' && query.key?.[1] === channelId
    })
  }

  const invalidateChannelCacheByAlbum = albumId => {
    if (!albumId) return
    void queryCache.invalidateQueries({
      key: channelByAlbumQueryOptions(albumId).key,
      exact: true
    })
  }

  const invalidateChannelCacheByMedia = mediaId => {
    if (!mediaId) return
    void queryCache.invalidateQueries({
      key: channelByMediaQueryOptions(mediaId).key,
      exact: true
    })
  }

  const invalidatePrivateMediaCache = privateMediaId => {
    if (!privateMediaId) return
    void queryCache.invalidateQueries({
      key: privateMediaQueryOptions(privateMediaId).key,
      exact: true
    })
  }

  const invalidatePrivateAlbumCache = privateAlbumId => {
    if (!privateAlbumId) return
    void queryCache.invalidateQueries({
      predicate: query =>
        query.key?.[0] === 'channel' &&
        query.key?.[1] === 'private-album' &&
        query.key?.[2] === privateAlbumId
    })
  }

  const loadChannels = async deep => {
    const options = channelsQueryOptions(deep)
    const entry = queryCache.ensure(options)
    const state = await queryCache.refresh(entry, options)
    if (state?.status === 'error') {
      throw state.error || new Error('Channel query failed')
    }
    const value = Array.isArray(state?.data) ? state.data : []
    setChannels(value)
    return value
  }

  const resolveHistoryChannels = async items => {
    if (!Array.isArray(items) || items.length === 0) {
      return { items: [], deletedPublicIds: [] }
    }

    const { data } = await api.post(
      '/channels/history',
      { items },
      {
        __skipGlobalErrorNotify: true
      }
    )

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      deletedPublicIds: Array.isArray(data?.deletedPublicIds) ? data.deletedPublicIds : []
    }
  }

  const loadChannel = async ({ channelId, pending = false, cache = true }) => {
    const options = channelQueryOptions(channelId, pending)

    try {
      if (!cache) {
        const { data } = await api.get(`/channels/${channelId}${pending ? '?pending=true' : ''}`)
        return data?.channel ?? null
      }

      const entry = queryCache.ensure(options)
      const state = await queryCache.refresh(entry, options)
      if (state?.status === 'error') {
        throw state.error || new Error('Channel query failed')
      }
      return state?.data?.channel ?? null
    } catch (error) {
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const createMediaSession = async ({ privateId }) => {
    const res = await api.post(`/channels/media/session/${privateId}`)
    return res.data
  }

  const deleteResource = async resource => {
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

    invalidateChannelsCache()
    if (resource.type === 'channel') {
      invalidateChannelCacheById(resource.id)
    } else if (resource.type === 'album') {
      invalidateChannelCacheByAlbum(resource.id)
    } else if (resource.type === 'media') {
      invalidateChannelCacheByMedia(resource.id)
    }
    setChannels([])
    await loadChannels(true)
  }

  const undeleteResource = async resource => {
    if (!['media', 'album', 'channel'].includes(resource?.type)) {
      throw new Error('Unsupported undelete resource type')
    }

    let url = `/channels/media/${resource.id}/undelete`
    if (resource.type === 'album') {
      url = `/channels/album/${resource.id}/undelete`
    } else if (resource.type === 'channel') {
      url = `/channels/${resource.id}/undelete`
    }
    await api.put(url, null, {
      __skipGlobalErrorNotify: true
    })

    invalidateChannelsCache()
    if (resource.type === 'album') {
      invalidateChannelCacheByAlbum(resource.id)
    } else if (resource.type === 'channel') {
      invalidateChannelCacheById(resource.id)
    } else {
      invalidateChannelCacheByMedia(resource.id)
    }
    setChannels([])
    await loadChannels(true)
  }

  const postUploadDraft = async payload => {
    try {
      const { data } = await api.post('/channels/media/draft', payload, {
        __skipGlobalErrorNotify: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })

      const normalizedData = {
        mediaId: data?.mediaId ?? null,
        requiredResources: data.requiredResources,
        uploadEndpoint: data.uploadEndpoint,
        instructions: data.instructions
      }

      setUpload(normalizedData.instructions)
      return normalizedData
    } catch (error) {
      setUpload(null)
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const confirmUpload = media =>
    api
      .put(`/channels/media/confirm/${media}`, null, {
        __skipGlobalErrorNotify: true
      })
      .then(response => {
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(media)
        return response
      })

  const abortUpload = mediaId =>
    api
      .delete(`/channels/media/${mediaId}/abort`, {
        __skipGlobalErrorNotify: true
      })
      .then(response => {
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(mediaId)
        return response
      })

  const updateMedia = async ({ mediaId, title, description = null, resourceDate = null, main }) => {
    try {
      const res = await api.put(
        `/channels/media/${mediaId}`,
        {
          title: title?.trim(),
          description: description?.trim() || null,
          resourceDate: resourceDate?.trim() || null,
          main
        },
        {
          __skipGlobalErrorNotify: true
        }
      )
      invalidateChannelsCache()
      invalidateChannelCacheByMedia(mediaId)
      return res.data
    } catch (error) {
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const updateAlbum = async ({
    albumId,
    title,
    subtitle = null,
    posterType,
    posterColor = null
  }) => {
    try {
      const res = await api.put(
        `/channels/album/${albumId}`,
        {
          title: title?.trim(),
          subtitle: subtitle?.trim() || null,
          posterType,
          posterColor
        },
        {
          __skipGlobalErrorNotify: true
        }
      )
      invalidateChannelsCache()
      invalidateChannelCacheByAlbum(albumId)
      return res.data
    } catch (error) {
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const updateChannel = async ({ channelPublicId, title }) => {
    try {
      const res = await api.put(
        `/channels/${channelPublicId}`,
        {
          title: title?.trim()
        },
        {
          __skipGlobalErrorNotify: true
        }
      )
      invalidateChannelsCache()
      invalidateChannelCacheById(channelPublicId)
      return res.data
    } catch (error) {
      getGlobalApiErrorPayload(error)
      throw error
    }
  }

  const requestMediaPreviewUpload = ({ mediaId }) =>
    requestUploadInstruction(`/channels/media/${mediaId}/preview`)

  const requestAlbumPosterUpload = ({ albumId }) =>
    requestUploadInstruction(`/channels/album/${albumId}/poster`)

  const requestChannelCoverUpload = ({ channelPublicId }) =>
    requestUploadInstruction(`/channels/${channelPublicId}/cover`)

  const confirmMediaPreviewUpload = ({
    mediaId,
    objectName,
    title,
    description = null,
    resourceDate = null,
    main
  }) =>
    api
      .put(
        `/channels/media/${mediaId}/preview/confirm`,
        {
          objectName,
          title: title?.trim(),
          description: description?.trim() || null,
          resourceDate: resourceDate?.trim() || null,
          main
        },
        { __skipGlobalErrorNotify: true }
      )
      .then(response => {
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(mediaId)
        return response
      })

  const confirmAlbumPosterUpload = ({
    albumId,
    objectName,
    title,
    subtitle = null,
    posterType,
    posterColor = null
  }) =>
    api
      .put(
        `/channels/album/${albumId}/poster/confirm`,
        {
          objectName,
          title: title?.trim(),
          subtitle: subtitle?.trim() || null,
          posterType,
          posterColor
        },
        { __skipGlobalErrorNotify: true }
      )
      .then(response => {
        invalidateChannelsCache()
        invalidateChannelCacheByAlbum(albumId)
        return response
      })

  const confirmChannelCoverUpload = ({ channelPublicId, objectName, title }) =>
    api
      .put(
        `/channels/${channelPublicId}/cover/confirm`,
        {
          objectName,
          title: title?.trim()
        },
        { __skipGlobalErrorNotify: true }
      )
      .then(response => {
        invalidateChannelsCache()
        invalidateChannelCacheById(channelPublicId)
        return response
      })

  const reportMedia = async ({ privateId, reason }) => {
    const res = await api.post(
      `/channels/media/private/${privateId}/report`,
      {
        reason: reason?.trim() || null
      },
      {
        __skipGlobalErrorNotify: true
      }
    )
    invalidatePrivateMediaCache(privateId)
    return res.data
  }

  return {
    channels,
    upload,
    loadChannels,
    resolveHistoryChannels,
    loadChannel,
    createMediaSession,
    deleteResource,
    undeleteResource,
    postUploadDraft,
    confirmUpload,
    abortUpload,
    updateMedia,
    updateAlbum,
    updateChannel,
    requestMediaPreviewUpload,
    requestAlbumPosterUpload,
    requestChannelCoverUpload,
    confirmMediaPreviewUpload,
    confirmAlbumPosterUpload,
    confirmChannelCoverUpload,
    reportMedia,
    channelsQueryOptions,
    channelByAlbumQueryOptions,
    channelByMediaQueryOptions,
    privateMediaQueryOptions,
    privateAlbumQueryOptions,
    invalidateChannelsCache,
    invalidateChannelCacheById,
    invalidateChannelCacheByAlbum,
    invalidateChannelCacheByMedia,
    invalidatePrivateMediaCache,
    invalidatePrivateAlbumCache,
    channelQueryOptions
  }
})
