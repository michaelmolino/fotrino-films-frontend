import { toValue } from 'vue'
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
  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const channelsQueryOptions = createApiGetQueryOptionsFactory({
    key: ['channels', 'flat'],
    staleTime: API_CACHE_MEDIUM_MS,
    url: '/channels',
    config: {},
    transform: data => toArray(data?.data)
  })

  const unifiedRouteQueryOptions = createApiGetQueryOptionsFactory({
    key: (resourceType, resourceId, withPending = false, withSoftDeleted = false) => [
      'channel',
      'resolve',
      resourceType,
      resourceId,
      withPending ? 'pending' : 'current',
      withSoftDeleted ? 'with-deleted' : 'without-deleted'
    ],
    staleTime: API_CACHE_MEDIUM_MS,
    url: (resourceType, resourceId, withPending = false, withSoftDeleted = false) => {
      const params = new URLSearchParams()
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
  ) => unifiedRouteQueryOptions('channel', channelPublicId, withPending, withSoftDeleted)

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
        return unifiedRouteQueryOptions('privateAlbum', target.privateAlbumId)
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
    return useQuery(() => ({
      ...channelsQueryOptions(),
      enabled: toValue(enabled)
    }))
  }

  const resolveHistory = async ({ items = [], current = null } = {}) => {
    if ((!Array.isArray(items) || items.length === 0) && !current) {
      return { items: [], deletedItems: [] }
    }

    const { data } = await api.post(
      '/history',
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
      deletedItems: Array.isArray(data?.data?.deletedItems) ? data.data.deletedItems : []
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
      invalidateChannelCacheById(resource.channelPublicId)
    } else if (resource.type === 'media') {
      invalidateChannelCacheByMedia(resource.publicId)
      invalidateChannelCacheById(resource.channelPublicId)
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
      invalidateChannelCacheById(resource.channelPublicId)
    } else if (resource.type === 'channel') {
      invalidateChannelCacheById(resource.publicId)
    } else {
      invalidateChannelCacheByMedia(resource.publicId)
      invalidateChannelCacheById(resource.channelPublicId)
    }
    return mutationResult({ ok: true })
  }

  const updateMedia = async ({
    channelPublicId = null,
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
    if (channelPublicId) invalidateChannelCacheById(channelPublicId)
    if (mediaPublicId) invalidateChannelCacheByMedia(mediaPublicId)
    return mutationResult({ ok: true, data: res.data?.data ?? null })
  }

  const updateAlbum = async ({
    channelPublicId = null,
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
    if (channelPublicId) invalidateChannelCacheById(channelPublicId)
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
          `/media-reports/media/private/${privateId}`,
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
    return mutationResult({ ok: true, data: res.data?.data ?? null })
  }

  const useChannelQuery = (channelPublicId, enabled = true, options = {}) => {
    return useQuery(() => ({
      ...channelQueryOptions(toValue(channelPublicId), options),
      enabled: toValue(enabled)
    }))
  }

  return {
    useChannelsQuery,
    useChannelQuery,
    resolveHistory,
    fetchChannel,
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
