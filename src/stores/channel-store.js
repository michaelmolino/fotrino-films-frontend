import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { normalizeChannelPayload, sortChannelDetail } from 'src/utils/read-model.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'
import { createRequestCanceler, isRequestCanceled } from 'src/stores/utils/request-canceler.js'
import { useQueryCache } from '@pinia/colada'
import { API_CACHE_MEDIUM_MS } from 'src/stores/utils/cache-timeouts.js'

const CHANNEL_LIST_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS
const CHANNEL_DETAIL_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS
const PRIVATE_MEDIA_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS
const PRIVATE_ALBUM_CACHE_TIMEOUT_MS = API_CACHE_MEDIUM_MS

const sortChannels = (channels, field = 'title', direction = 'desc') =>
  sortBy(channels, field, direction)

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])
  const channel = ref(null)
  const readModel = ref(null)
  const loadStatus = ref('idle')
  const upload = ref(null)
  const requestCanceler = createRequestCanceler()

  const queryCache = useQueryCache()

  const sortedAllMedia = computed(() => {
    if (!channel.value?.albums) return []
    return channel.value.albums.flatMap(album =>
      (album.media || []).map(media => ({ media, album }))
    )
  })

  const setChannelLoadStatus = value => {
    loadStatus.value = value
  }

  const setChannel = value => {
    const normalized = normalizeChannelPayload(value)
    channel.value = normalized.channel
    readModel.value = normalized.readModel
  }

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

  const channelsQueryOptions = (deep = false) => ({
    key: ['channels', deep ? 'deep' : 'flat'],
    staleTime: CHANNEL_LIST_CACHE_TIMEOUT_MS
  })

  const channelByAlbumQueryOptions = albumId => ({
    key: ['channel', 'album', albumId],
    staleTime: CHANNEL_DETAIL_CACHE_TIMEOUT_MS
  })

  const channelByMediaQueryOptions = mediaId => ({
    key: ['channel', 'media', mediaId],
    staleTime: CHANNEL_DETAIL_CACHE_TIMEOUT_MS
  })

  const privateMediaQueryOptions = privateMediaId => ({
    key: ['channel', 'private-media', privateMediaId],
    staleTime: PRIVATE_MEDIA_CACHE_TIMEOUT_MS
  })

  const privateAlbumQueryOptions = (privateAlbumId, privateMediaId = null) => ({
    key: ['channel', 'private-album', privateAlbumId, privateMediaId || 'root'],
    staleTime: PRIVATE_ALBUM_CACHE_TIMEOUT_MS
  })

  const invalidateChannelsCache = () => {
    queryCache.setQueryData(channelsQueryOptions(false).key, null)
    queryCache.setQueryData(channelsQueryOptions(true).key, null)
  }

  const invalidateChannelCacheById = channelId => {
    if (!channelId) return
    queryCache.setQueryData(channelQueryOptions(channelId).key, null)
  }

  const invalidateChannelCacheByAlbum = albumId => {
    if (!albumId) return
    queryCache.setQueryData(channelByAlbumQueryOptions(albumId).key, null)
  }

  const invalidateChannelCacheByMedia = mediaId => {
    if (!mediaId) return
    queryCache.setQueryData(channelByMediaQueryOptions(mediaId).key, null)
  }

  const invalidatePrivateMediaCache = privateMediaId => {
    if (!privateMediaId) return
    queryCache.setQueryData(privateMediaQueryOptions(privateMediaId).key, null)
  }

  const invalidatePrivateAlbumCache = privateAlbumId => {
    if (!privateAlbumId) return
    queryCache.invalidateQueries({
      predicate: query =>
        query.key?.[0] === 'channel' &&
        query.key?.[1] === 'private-album' &&
        query.key?.[2] === privateAlbumId
    })
  }

  const loadChannels = deep =>
    fetchAndApplyGet({
      api,
      url: deep ? '/channels/deep' : '/channels',
      apply: setChannels,
      extract: data => {
        const sorted = sortChannels(data)
        return deep ? sorted.map(sortChannelDetail) : sorted
      },
      cache: {
        queryOptions: channelsQueryOptions(deep),
        queryCache
      }
    })

  const channelsByPublicId = computed(() => readModel.value?.entities?.channelsByPublicId || {})
  const albumsByPublicId = computed(() => readModel.value?.entities?.albumsByPublicId || {})
  const mediaByPublicId = computed(() => readModel.value?.entities?.mediaByPublicId || {})

  const hydratedAlbumsByPublicId = computed(() => {
    const map = {}
    for (const album of channel.value?.albums || []) {
      if (album?.publicId) {
        map[album.publicId] = album
      }
    }
    const privateAlbum = channel.value?.album
    if (privateAlbum?.publicId && !map[privateAlbum.publicId]) {
      map[privateAlbum.publicId] = privateAlbum
    }
    return map
  })

  const findAlbumByPublicId = albumPublicId => {
    if (!albumPublicId) return null
    return (
      hydratedAlbumsByPublicId.value?.[albumPublicId] ||
      albumsByPublicId.value?.[albumPublicId] ||
      null
    )
  }

  const findMediaByPublicId = mediaPublicId => {
    if (!mediaPublicId) return null
    return mediaByPublicId.value?.[mediaPublicId] || null
  }

  const findAlbumByMediaPublicId = mediaPublicId => {
    const media = findMediaByPublicId(mediaPublicId)
    const albumPublicId = media?.albumPublicId
    return albumPublicId ? findAlbumByPublicId(albumPublicId) : null
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

  const loadChannel = ({ channelId, pending = false, cache = true }) => {
    const url = `/channels/${channelId}${pending ? '?pending=true' : ''}`
    return fetchAndApplyGet({
      api,
      url,
      apply: setChannel,
      extract: payload => payload,
      onError: error => {
        if (!isRequestCanceled(error)) {
          getGlobalApiErrorPayload(error)
        }
      },
      requestConfig: {
        signal: requestCanceler.getSignal('SET_CHANNEL')
      },
      ...(cache && {
        cache: {
          queryOptions: channelQueryOptions(channelId),
          queryCache
        }
      })
    })
  }

  const loadChannelByAlbum = albumId =>
    fetchAndApplyGet({
      api,
      url: `/channels/album/${albumId}`,
      apply: setChannel,
      extract: payload => payload,
      onError: error => {
        if (!isRequestCanceled(error)) {
          getGlobalApiErrorPayload(error)
        }
      },
      requestConfig: {
        signal: requestCanceler.getSignal('SET_CHANNEL')
      },
      cache: {
        queryOptions: channelByAlbumQueryOptions(albumId),
        queryCache
      }
    })

  const loadChannelByMedia = mediaId =>
    fetchAndApplyGet({
      api,
      url: `/channels/media/${mediaId}`,
      apply: setChannel,
      extract: payload => payload,
      onError: error => {
        if (!isRequestCanceled(error)) {
          getGlobalApiErrorPayload(error)
        }
      },
      requestConfig: {
        signal: requestCanceler.getSignal('SET_CHANNEL')
      },
      cache: {
        queryOptions: channelByMediaQueryOptions(mediaId),
        queryCache
      }
    })

  const loadPrivateMedia = privateMediaId =>
    fetchAndApplyGet({
      api,
      url: `/channels/media/private/${privateMediaId}`,
      apply: setChannel,
      onError: error => {
        if (!isRequestCanceled(error)) {
          getGlobalApiErrorPayload(error)
        }
      },
      requestConfig: {
        signal: requestCanceler.getSignal('SET_CHANNEL')
      },
      cache: {
        queryOptions: privateMediaQueryOptions(privateMediaId),
        queryCache
      }
    })

  const loadPrivateAlbum = ({ privateAlbumId, privateMediaId = null }) => {
    const mediaQuery = privateMediaId ? `?mediaPrivateId=${encodeURIComponent(privateMediaId)}` : ''
    return fetchAndApplyGet({
      api,
      url: `/channels/album/private/${privateAlbumId}${mediaQuery}`,
      apply: setChannel,
      onError: error => {
        if (!isRequestCanceled(error)) {
          getGlobalApiErrorPayload(error)
        }
      },
      requestConfig: {
        signal: requestCanceler.getSignal('SET_CHANNEL')
      },
      cache: {
        queryOptions: privateAlbumQueryOptions(privateAlbumId, privateMediaId),
        queryCache
      }
    })
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

  const channelQueryOptions = uuid => ({
    key: ['channel', uuid],
    staleTime: CHANNEL_DETAIL_CACHE_TIMEOUT_MS
  })

  return {
    channels,
    channel,
    readModel,
    channelsByPublicId,
    albumsByPublicId,
    mediaByPublicId,
    sortedAllMedia,
    loadStatus,
    upload,
    setChannelLoadStatus,
    setChannel,
    loadChannels,
    findAlbumByPublicId,
    findMediaByPublicId,
    findAlbumByMediaPublicId,
    resolveHistoryChannels,
    loadChannel,
    loadChannelByAlbum,
    loadChannelByMedia,
    loadPrivateMedia,
    loadPrivateAlbum,
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
