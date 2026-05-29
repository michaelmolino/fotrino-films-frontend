import { ref, watch, toValue } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { API_CACHE_MEDIUM_MS } from 'src/stores/utils/cache-timeouts.js'
import { mutationResult, runMutation } from 'src/utils/storeMutations.js'
import {
  createApiGetQueryOptionsFactory,
  invalidateQueriesSafely,
  toArray
} from 'src/stores/utils/query-helpers.js'
import { api } from 'src/clients/axios-client.js'
import {
  assertDataEnvelopeArrayResponse,
  assertChannelViewResponse,
  assertHistoryResolveResponse
} from 'src/utils/responseGuards.js'

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])

  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const setChannels = value => {
    channels.value = value
  }

  const channelQueryOptions = createApiGetQueryOptionsFactory({
    key: (channelPublicId, pending = false) => [
      'channel',
      channelPublicId,
      pending ? 'pending' : 'current'
    ],
    staleTime: API_CACHE_MEDIUM_MS,
    url: (channelPublicId, pending = false) =>
      `/channels/${channelPublicId}${pending ? '?pending=true' : ''}`,
    config: {
      __policy: {
        notFound: 'route404'
      },
      __responseGuard: assertChannelViewResponse
    }
  })

  const channelsQueryOptions = createApiGetQueryOptionsFactory({
    key: ['channels', 'flat'],
    staleTime: API_CACHE_MEDIUM_MS,
    url: '/channels',
    config: {
      __responseGuard: data => assertDataEnvelopeArrayResponse(data, 'Channels list')
    },
    transform: data => toArray(data?.data)
  })

  const channelByAlbumQueryOptions = createApiGetQueryOptionsFactory({
    key: albumPublicId => ['channel', 'album', albumPublicId],
    staleTime: API_CACHE_MEDIUM_MS,
    url: albumPublicId => `/channels/album/${albumPublicId}`,
    config: {
      __policy: {
        notFound: 'route404'
      },
      __responseGuard: assertChannelViewResponse
    }
  })

  const channelByMediaQueryOptions = createApiGetQueryOptionsFactory({
    key: mediaPublicId => ['channel', 'media', mediaPublicId],
    staleTime: API_CACHE_MEDIUM_MS,
    url: mediaPublicId => `/channels/media/${mediaPublicId}`,
    config: {
      __policy: {
        notFound: 'route404'
      },
      __responseGuard: assertChannelViewResponse
    }
  })

  const privateMediaQueryOptions = createApiGetQueryOptionsFactory({
    key: privateMediaId => ['channel', 'private-media', privateMediaId],
    staleTime: API_CACHE_MEDIUM_MS,
    url: privateMediaId => `/channels/media/private/${privateMediaId}`,
    config: {
      __policy: {
        notFound: 'route404'
      },
      __responseGuard: assertChannelViewResponse
    }
  })

  const privateAlbumQueryOptions = createApiGetQueryOptionsFactory({
    key: (privateAlbumId, privateMediaId = null) => [
      'channel',
      'private-album',
      privateAlbumId,
      privateMediaId || 'root'
    ],
    staleTime: API_CACHE_MEDIUM_MS,
    url: (privateAlbumId, privateMediaId = null) => {
      const mediaQuery = privateMediaId
        ? `?mediaPrivateId=${encodeURIComponent(privateMediaId)}`
        : ''
      return `/channels/album/private/${privateAlbumId}${mediaQuery}`
    },
    config: {
      __policy: {
        notFound: 'route404'
      },
      __responseGuard: assertChannelViewResponse
    }
  })

  const invalidateChannelsCache = () => {
    invalidateQueriesSafely(queryCache, {
      key: channelsQueryOptions().key,
      exact: true
    })
  }

  const invalidateChannelCacheById = channelPublicId => {
    if (!channelPublicId) return
    invalidateQueriesSafely(queryCache, {
      predicate: query => query.key?.[0] === 'channel' && query.key?.[1] === channelPublicId
    })
  }

  const invalidateChannelCacheByAlbum = albumPublicId => {
    if (!albumPublicId) return
    invalidateQueriesSafely(queryCache, {
      key: channelByAlbumQueryOptions(albumPublicId).key,
      exact: true
    })
  }

  const invalidateChannelCacheByMedia = mediaPublicId => {
    if (!mediaPublicId) return
    invalidateQueriesSafely(queryCache, {
      key: channelByMediaQueryOptions(mediaPublicId).key,
      exact: true
    })
  }

  const invalidatePrivateMediaCache = privateMediaId => {
    if (!privateMediaId) return
    invalidateQueriesSafely(queryCache, {
      key: privateMediaQueryOptions(privateMediaId).key,
      exact: true
    })
  }

  const invalidatePrivateAlbumCache = privateAlbumId => {
    if (!privateAlbumId) return
    invalidateQueriesSafely(queryCache, {
      predicate: query =>
        query.key?.[0] === 'channel' &&
        query.key?.[1] === 'private-album' &&
        query.key?.[2] === privateAlbumId
    })
  }

  const useChannelsQuery = (enabled = true) => {
    const query = useQuery(() => ({
      ...channelsQueryOptions(),
      enabled: toValue(enabled)
    }))

    watch(
      () => query.data.value,
      value => {
        setChannels(toArray(value))
      },
      { immediate: true }
    )

    watch(
      () => query.error.value,
      error => {
        if (error) {
          setChannels([])
        }
      },
      { immediate: true }
    )

    return query
  }

  const resolveHistoryChannels = async items => {
    if (!Array.isArray(items) || items.length === 0) {
      return { items: [], deletedItems: [] }
    }

    const { data } = await api.post('/channels/history', { items }, {
      __policy: {
        loading: 'none'
      },
      __responseGuard: assertHistoryResolveResponse
    })

    return {
      items: Array.isArray(data?.data?.items) ? data.data.items : [],
      deletedItems: Array.isArray(data?.data?.deletedItems) ? data.data.deletedItems : []
    }
  }

  const fetchChannel = async ({ channelPublicId, pending = false, cache = true }) => {
    if (!cache) {
      const { data } = await api.get(`/channels/${channelPublicId}${pending ? '?pending=true' : ''}`)
      return data?.data ?? null
    }

    const options = channelQueryOptions(channelPublicId, pending)
    const entry = queryCache.ensure(options)
    const state = await queryCache.fetch(entry, options)
    if (state?.status === 'error') {
      throw state.error || new Error('Channel query failed')
    }
    return state?.data?.data ?? null
  }

  const createMediaSession = async ({ privateId }) => {
    const res = await api.post(`/channels/media/session/${privateId}`)
    return mutationResult({ ok: true, data: res.data?.data ?? null })
  }

  const deleteResource = async resource => {
    if (resource.type === 'channel' && !resource.channelPublicId) {
      throw new Error('channelPublicId is required for channel deletion')
    }
    if (resource.type !== 'channel' && !resource.privateId) {
      throw new Error('privateId is required for media/album deletion')
    }

    let url = `/channels/${resource.type}/${resource.privateId}`
    if (resource.type === 'channel') {
      url = `/channels/${resource.channelPublicId}`
    }

    const response = await runMutation({
      request: () => api.delete(url),
      onError: error => {
        if (error?.__userCancelled) {
          return CANCELLED
        }
      }
    })

    if (response === CANCELLED) {
      return mutationResult({ ok: false, cancelled: true })
    }

    invalidateChannelsCache()
    if (resource.type === 'channel') {
      invalidateChannelCacheById(resource.publicId)
    } else if (resource.type === 'album') {
      invalidateChannelCacheByAlbum(resource.publicId)
    } else if (resource.type === 'media') {
      invalidateChannelCacheByMedia(resource.publicId)
    }
    return mutationResult({ ok: true })
  }

  const undeleteResource = async resource => {
    if (!['media', 'album', 'channel'].includes(resource?.type)) {
      throw new Error('Unsupported undelete resource type')
    }
    if (resource.type === 'channel' && !resource.channelPublicId) {
      throw new Error('channelPublicId is required for channel undelete')
    }
    if (resource.type !== 'channel' && !resource.privateId) {
      throw new Error('privateId is required for media/album undelete')
    }

    let url = `/channels/media/${resource.privateId}/undelete`
    if (resource.type === 'album') {
      url = `/channels/album/${resource.privateId}/undelete`
    } else if (resource.type === 'channel') {
      url = `/channels/${resource.channelPublicId}/undelete`
    }

    await runMutation({
      request: () => api.put(url, null)
    })

    invalidateChannelsCache()
    if (resource.type === 'album') {
      invalidateChannelCacheByAlbum(resource.publicId)
    } else if (resource.type === 'channel') {
      invalidateChannelCacheById(resource.publicId)
    } else {
      invalidateChannelCacheByMedia(resource.publicId)
    }
    return mutationResult({ ok: true })
  }

  const updateMedia = async ({ mediaPrivateId, mediaPublicId = null, title, description = null, resourceDate = null, main }) => {
    const res = await runMutation({
      request: () =>
        api.put(`/channels/media/${mediaPrivateId}`, {
          title: title?.trim(),
          description: description?.trim() || null,
          resourceDate: resourceDate?.trim() || null,
          main
        })
    })
    invalidateChannelsCache()
    if (mediaPublicId) invalidateChannelCacheByMedia(mediaPublicId)
    return mutationResult({ ok: true, data: res.data?.data ?? null })
  }

  const updateAlbum = async ({
    albumPrivateId,
    albumPublicId = null,
    title,
    subtitle = null,
    posterType,
    posterColor = null
  }) => {
    const res = await runMutation({
      request: () =>
        api.put(`/channels/album/${albumPrivateId}`, {
          title: title?.trim(),
          subtitle: subtitle?.trim() || null,
          posterType,
          posterColor
        })
    })
    invalidateChannelsCache()
    if (albumPublicId) invalidateChannelCacheByAlbum(albumPublicId)
    return mutationResult({ ok: true, data: res.data?.data ?? null })
  }

  const updateChannel = async ({ channelPublicId, title }) => {
    const res = await runMutation({
      request: () =>
        api.put(`/channels/${channelPublicId}`, {
          title: title?.trim()
        })
    })
    invalidateChannelsCache()
    invalidateChannelCacheById(channelPublicId)
    return mutationResult({ ok: true, data: res.data?.data ?? null })
  }

  const reportMedia = async ({ privateId, reason }) => {
    const res = await runMutation({
      request: () =>
        api.post(`/channels/media/private/${privateId}/report`, {
          reason: reason?.trim() || null
        })
    })
    invalidatePrivateMediaCache(privateId)
    return mutationResult({ ok: true, data: res.data })
  }

  const useChannelQuery = (channelPublicId, enabled = true) => {
    return useQuery(() => ({
      ...channelQueryOptions(toValue(channelPublicId)),
      enabled: toValue(enabled)
    }))
  }

  return {
    channels,
    useChannelsQuery,
    useChannelQuery,
    resolveHistoryChannels,
    fetchChannel,
    createMediaSession,
    deleteResource,
    undeleteResource,
    updateMedia,
    updateAlbum,
    updateChannel,
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
