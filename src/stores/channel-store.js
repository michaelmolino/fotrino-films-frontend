import { ref, watch, toValue } from 'vue'
import { defineStore } from 'pinia'
import { useQuery, useQueryCache } from '@pinia/colada'
import { API_CACHE_MEDIUM_MS } from 'src/stores/utils/cache-timeouts.js'
import { mutationResult, runMutation } from 'src/stores/utils/store-mutations.js'
import {
  createApiGetQueryOptionsFactory,
  invalidateQueriesSafely,
  toArray
} from 'src/stores/utils/query-helpers.js'
import { api } from 'src/clients/axios-client.js'

export const useChannelStore = defineStore('channel', () => {
  const channels = ref([])

  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const setChannels = value => {
    channels.value = value
  }

  const channelsQueryOptions = createApiGetQueryOptionsFactory({
    key: ['channels', 'flat'],
    staleTime: API_CACHE_MEDIUM_MS,
    url: '/channels',
    config: {},
    transform: data => toArray(data?.data)
  })

  const unifiedRouteQueryOptions = createApiGetQueryOptionsFactory({
    key: (
      resourceType,
      resourceId,
      focusedMediaPrivateId = null,
      withPending = false,
      withSoftDeleted = false
    ) => [
      'channel',
      'resolve',
      resourceType,
      resourceId,
      focusedMediaPrivateId || 'root',
      withPending ? 'pending' : 'current',
      withSoftDeleted ? 'with-deleted' : 'without-deleted'
    ],
    staleTime: API_CACHE_MEDIUM_MS,
    url: (
      resourceType,
      resourceId,
      focusedMediaPrivateId = null,
      withPending = false,
      withSoftDeleted = false
    ) => {
      const params = new URLSearchParams()
      if (resourceType === 'privateAlbumMedia' && focusedMediaPrivateId) {
        params.set('mediaPrivateId', focusedMediaPrivateId)
      }
      if (resourceType === 'channel' && withPending) {
        params.set('withPending', 'true')
      }
      if (resourceType === 'channel' && withSoftDeleted) {
        params.set('withSoftDeleted', 'true')
      }
      const query = params.toString()
      const suffix = query ? `?${query}` : ''
      return `/channels/resolve/${resourceType}/${resourceId}${suffix}`
    },
    config: {
      __policy: {
        notFoundHandling: 'global'
      }
    }
  })

  const channelQueryOptions = (
    channelPublicId,
    { withPending = false, withSoftDeleted = false } = {}
  ) => unifiedRouteQueryOptions('channel', channelPublicId, null, withPending, withSoftDeleted)

  const routeTargetQueryOptions = target => {
    if (!target?.type) return null

    switch (target.type) {
      case 'channel':
        return unifiedRouteQueryOptions('channel', target.publicId)
      case 'album':
        return unifiedRouteQueryOptions('album', target.publicId)
      case 'media':
        return unifiedRouteQueryOptions('media', target.publicId)
      case 'privateAlbum':
        return unifiedRouteQueryOptions('privateAlbum', target.privateAlbumId)
      case 'privateAlbumMedia':
        return unifiedRouteQueryOptions(
          'privateAlbumMedia',
          target.privateAlbumId,
          target.privateMediaId
        )
      case 'privateMedia':
        return unifiedRouteQueryOptions('privateMedia', target.privateMediaId)
      default:
        return null
    }
  }

  const invalidateChannelsCache = () => {
    invalidateQueriesSafely(queryCache, {
      key: channelsQueryOptions().key,
      exact: true
    })
  }

  const invalidateChannelCacheById = channelPublicId => {
    if (!channelPublicId) return
    invalidateQueriesSafely(queryCache, {
      predicate: query =>
        query.key?.[0] === 'channel' &&
        query.key?.[1] === 'resolve' &&
        query.key?.[2] === 'channel' &&
        query.key?.[3] === channelPublicId
    })
  }

  const invalidateChannelCacheByAlbum = albumPublicId => {
    if (!albumPublicId) return
    invalidateQueriesSafely(queryCache, {
      key: unifiedRouteQueryOptions('album', albumPublicId).key,
      exact: true
    })
  }

  const invalidateChannelCacheByMedia = mediaPublicId => {
    if (!mediaPublicId) return
    invalidateQueriesSafely(queryCache, {
      key: unifiedRouteQueryOptions('media', mediaPublicId).key,
      exact: true
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

  const resolveHistoryChannels = async ({ items = [], current = null } = {}) => {
    if ((!Array.isArray(items) || items.length === 0) && !current) {
      return { items: [], deletedItems: [] }
    }

    const { data } = await api.post(
      '/channels/history',
      { items, current },
      {
        __policy: {
          loadHandling: 'none',
          csrfHandling: 'none'
        }
      }
    )

    return {
      items: Array.isArray(data?.data?.items) ? data.data.items : [],
      deletedItems: Array.isArray(data?.data?.deletedItems) ? data.data.deletedItems : [],
      persistedItems: Array.isArray(data?.data?.persistedItems) ? data.data.persistedItems : []
    }
  }

  const fetchChannel = async ({
    channelPublicId,
    withPending = false,
    withSoftDeleted = false,
    cache = true
  }) => {
    const options = channelQueryOptions(channelPublicId, { withPending, withSoftDeleted })

    if (!cache) {
      const { data } = await api.get(options.url, options.config)
      return data?.data ?? null
    }

    const entry = queryCache.ensure(options)
    const state = await queryCache.fetch(entry, options)
    if (state?.status === 'error') {
      throw state.error || new Error('Channel query failed')
    }
    return state?.data?.data ?? null
  }

  const createMediaSession = async ({ privateId }) => {
    const res = await api.post(`/channels/media/session/${privateId}`, null, {
      __policy: {
        csrfHandling: 'none'
      }
    })
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

  const updateMedia = async ({
    mediaPrivateId,
    mediaPublicId = null,
    title,
    description = null,
    resourceDate = null,
    main
  }) => {
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
        api.post(
          `/channels/media/private/${privateId}/report`,
          {
            reason: reason?.trim() || null
          },
          {
            __policy: {
              csrfHandling: 'none'
            }
          }
        )
    })
    if (privateId) {
      invalidateQueriesSafely(queryCache, {
        key: unifiedRouteQueryOptions('privateMedia', privateId).key,
        exact: true
      })
    }
    return mutationResult({ ok: true, data: res.data })
  }

  const useChannelQuery = (channelPublicId, enabled = true, options = {}) => {
    return useQuery(() => ({
      ...channelQueryOptions(toValue(channelPublicId), options),
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
    routeTargetQueryOptions,
    invalidateChannelsCache,
    invalidateChannelCacheById,
    invalidateChannelCacheByAlbum,
    invalidateChannelCacheByMedia
  }
})
