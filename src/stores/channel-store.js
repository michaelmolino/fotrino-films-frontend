import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
import { useQuery, useQueryCache } from '@pinia/colada'
import { API_CACHE_MEDIUM_MS } from 'src/stores/utils/cache-timeouts.js'
import { mutationResult, runMutation } from 'src/utils/storeMutations.js'

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])

  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const setChannels = value => {
    channels.value = value
  }

  const invalidateQueries = options => {
    queryCache.invalidateQueries(options).catch(() => { })
  }

  const channelQueryOptions = (channelPublicId, pending = false) => ({
    key: ['channel', channelPublicId, pending ? 'pending' : 'current'],
    staleTime: API_CACHE_MEDIUM_MS,
    query: async () => {
      const url = `/channels/${channelPublicId}${pending ? '?pending=true' : ''}`
      const { data } = await api.get(url, {
        __redirectNotFoundTo404: true
      })
      return data
    }
  })

  const channelsQueryOptions = (deep = false) => ({
    key: ['channels', deep ? 'deep' : 'flat'],
    staleTime: API_CACHE_MEDIUM_MS,
    query: async () => {
      const { data } = await api.get(deep ? '/channels/deep' : '/channels')
      return Array.isArray(data) ? data : []
    }
  })

  const channelByAlbumQueryOptions = albumPublicId => ({
    key: ['channel', 'album', albumPublicId],
    staleTime: API_CACHE_MEDIUM_MS,
    query: async () => {
      const { data } = await api.get(`/channels/album/${albumPublicId}`, {
        __redirectNotFoundTo404: true
      })
      return data
    }
  })

  const channelByMediaQueryOptions = mediaPublicId => ({
    key: ['channel', 'media', mediaPublicId],
    staleTime: API_CACHE_MEDIUM_MS,
    query: async () => {
      const { data } = await api.get(`/channels/media/${mediaPublicId}`, {
        __redirectNotFoundTo404: true
      })
      return data
    }
  })

  const privateMediaQueryOptions = privateMediaId => ({
    key: ['channel', 'private-media', privateMediaId],
    staleTime: API_CACHE_MEDIUM_MS,
    query: async () => {
      const { data } = await api.get(`/channels/media/private/${privateMediaId}`, {
        __redirectNotFoundTo404: true
      })
      return data
    }
  })

  const privateAlbumQueryOptions = (privateAlbumId, privateMediaId = null) => ({
    key: ['channel', 'private-album', privateAlbumId, privateMediaId || 'root'],
    staleTime: API_CACHE_MEDIUM_MS,
    query: async () => {
      const mediaQuery = privateMediaId
        ? `?mediaPrivateId=${encodeURIComponent(privateMediaId)}`
        : ''
      const { data } = await api.get(`/channels/album/private/${privateAlbumId}${mediaQuery}`, {
        __redirectNotFoundTo404: true
      })
      return data
    }
  })

  const invalidateChannelsCache = () => {
    invalidateQueries({
      key: channelsQueryOptions(false).key,
      exact: true
    })
    invalidateQueries({
      key: channelsQueryOptions(true).key,
      exact: true
    })
  }

  const invalidateChannelCacheById = channelPublicId => {
    if (!channelPublicId) return
    invalidateQueries({
      predicate: query => query.key?.[0] === 'channel' && query.key?.[1] === channelPublicId
    })
  }

  const invalidateChannelCacheByAlbum = albumPublicId => {
    if (!albumPublicId) return
    invalidateQueries({
      key: channelByAlbumQueryOptions(albumPublicId).key,
      exact: true
    })
  }

  const invalidateChannelCacheByMedia = mediaPublicId => {
    if (!mediaPublicId) return
    invalidateQueries({
      key: channelByMediaQueryOptions(mediaPublicId).key,
      exact: true
    })
  }

  const invalidatePrivateMediaCache = privateMediaId => {
    if (!privateMediaId) return
    invalidateQueries({
      key: privateMediaQueryOptions(privateMediaId).key,
      exact: true
    })
  }

  const invalidatePrivateAlbumCache = privateAlbumId => {
    if (!privateAlbumId) return
    invalidateQueries({
      predicate: query =>
        query.key?.[0] === 'channel' &&
        query.key?.[1] === 'private-album' &&
        query.key?.[2] === privateAlbumId
    })
  }

  const useChannelsQuery = (deep = false) => {
    const query = useQuery(() => channelsQueryOptions(deep))

    watch(
      () => query.data.value,
      value => {
        setChannels(Array.isArray(value) ? value : [])
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

    const { data } = await api.post('/channels/history', { items })

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      deletedItems: Array.isArray(data?.deletedItems) ? data.deletedItems : []
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
    return mutationResult({ ok: true, data: res.data })
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
    return mutationResult({ ok: true, data: res.data })
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
    return mutationResult({ ok: true, data: res.data })
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
    return mutationResult({ ok: true, data: res.data })
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

  return {
    channels,
    useChannelsQuery,
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
