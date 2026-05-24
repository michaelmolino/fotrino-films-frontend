import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { useQueryCache } from '@pinia/colada'
import { API_CACHE_MEDIUM_MS } from 'src/stores/utils/cache-timeouts.js'

export const useChannelStore = defineStore('channel', () => {
    const channels = ref([])
    const upload = ref(null)

    const queryCache = useQueryCache()

    const runStoreQuery = async ({ options, apply, onError }) => {
        const entry = queryCache.ensure(options)

        try {
            const state = await queryCache.refresh(entry, options)
            if (state?.status === 'error') {
                throw state.error || new Error('Channel query failed')
            }
            const value = state?.data ?? null
            if (typeof apply === 'function') {
                apply(value)
            }
            return value
        } catch (error) {
            if (typeof apply === 'function') {
                apply(null)
            }
            if (typeof onError === 'function') {
                const maybe = onError(error)
                if (maybe !== undefined) {
                    return maybe
                }
            }
            throw error
        }
    }

    const runStoreMutation = async ({ request, onSuccess, onError }) => {
        try {
            const result = await request()
            if (typeof onSuccess === 'function') {
                await onSuccess(result)
            }
            return result
        } catch (error) {
            if (typeof onError === 'function') {
                const maybe = onError(error)
                if (maybe !== undefined) {
                    return maybe
                }
            }
            getGlobalApiErrorPayload(error)
            throw error
        }
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

    const channelQueryOptions = (channelId, pending = false) => ({
        key: ['channel', channelId, pending ? 'pending' : 'current'],
        staleTime: API_CACHE_MEDIUM_MS,
        query: async () => {
            const url = `/channels/${channelId}${pending ? '?pending=true' : ''}`
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

    const channelByAlbumQueryOptions = albumId => ({
        key: ['channel', 'album', albumId],
        staleTime: API_CACHE_MEDIUM_MS,
        query: async () => {
            const { data } = await api.get(`/channels/album/${albumId}`, {
                __redirectNotFoundTo404: true
            })
            return data
        }
    })

    const channelByMediaQueryOptions = mediaId => ({
        key: ['channel', 'media', mediaId],
        staleTime: API_CACHE_MEDIUM_MS,
        query: async () => {
            const { data } = await api.get(`/channels/media/${mediaId}`, {
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
            const mediaQuery = privateMediaId ? `?mediaPrivateId=${encodeURIComponent(privateMediaId)}` : ''
            const { data } = await api.get(`/channels/album/private/${privateAlbumId}${mediaQuery}`, {
                __redirectNotFoundTo404: true
            })
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

    const loadChannels = deep =>
        runStoreQuery({
            options: channelsQueryOptions(deep),
            apply: value => {
                setChannels(Array.isArray(value) ? value : [])
            },
            onError: error => {
                getGlobalApiErrorPayload(error)
            }
        })

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
        try {
            if (!cache) {
                const { data } = await api.get(`/channels/${channelId}${pending ? '?pending=true' : ''}`)
                return data?.channel ?? null
            }

            const value = await runStoreQuery({
                options: channelQueryOptions(channelId, pending),
                onError: error => {
                    getGlobalApiErrorPayload(error)
                }
            })
            return value?.channel ?? null
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

        const response = await runStoreMutation({
            request: () =>
                api.delete(url, {
                    __skipGlobalErrorNotify: true
                }),
            onError: error => {
                if (error?.__userCancelled) {
                    return false
                }
            }
        })

        if (response === false) {
            return false
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

        await runStoreMutation({
            request: () =>
                api.put(url, null, {
                    __skipGlobalErrorNotify: true
                })
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
        const response = await runStoreMutation({
            request: () =>
                api.post('/channels/media/draft', payload, {
                    __skipGlobalErrorNotify: true,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    }
                }),
            onError: () => {
                setUpload(null)
            }
        })

        const data = response?.data || {}
        const normalizedData = {
            mediaId: data?.mediaId ?? null,
            requiredResources: data.requiredResources,
            uploadEndpoint: data.uploadEndpoint,
            instructions: data.instructions
        }

        setUpload(normalizedData.instructions)
        return normalizedData
    }

    const confirmUpload = async media => {
        const response = await runStoreMutation({
            request: () =>
                api.put(`/channels/media/confirm/${media}`, null, {
                    __skipGlobalErrorNotify: true
                })
        })
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(media)
        return response
    }

    const abortUpload = async mediaId => {
        const response = await runStoreMutation({
            request: () =>
                api.delete(`/channels/media/${mediaId}/abort`, {
                    __skipGlobalErrorNotify: true
                })
        })
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(mediaId)
        return response
    }

    const updateMedia = async ({ mediaId, title, description = null, resourceDate = null, main }) => {
        const res = await runStoreMutation({
            request: () =>
                api.put(
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
        })
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(mediaId)
        return res.data
    }

    const updateAlbum = async ({
        albumId,
        title,
        subtitle = null,
        posterType,
        posterColor = null
    }) => {
        const res = await runStoreMutation({
            request: () =>
                api.put(
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
        })
        invalidateChannelsCache()
        invalidateChannelCacheByAlbum(albumId)
        return res.data
    }

    const updateChannel = async ({ channelPublicId, title }) => {
        const res = await runStoreMutation({
            request: () =>
                api.put(
                    `/channels/${channelPublicId}`,
                    {
                        title: title?.trim()
                    },
                    {
                        __skipGlobalErrorNotify: true
                    }
                )
        })
        invalidateChannelsCache()
        invalidateChannelCacheById(channelPublicId)
        return res.data
    }

    const requestMediaPreviewUpload = ({ mediaId }) =>
        requestUploadInstruction(`/channels/media/${mediaId}/preview`)

    const requestAlbumPosterUpload = ({ albumId }) =>
        requestUploadInstruction(`/channels/album/${albumId}/poster`)

    const requestChannelCoverUpload = ({ channelPublicId }) =>
        requestUploadInstruction(`/channels/${channelPublicId}/cover`)

    const confirmMediaPreviewUpload = async ({
        mediaId,
        objectName,
        title,
        description = null,
        resourceDate = null,
        main
    }) => {
        const response = await runStoreMutation({
            request: () =>
                api.put(
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
        })
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(mediaId)
        return response
    }

    const confirmAlbumPosterUpload = async ({
        albumId,
        objectName,
        title,
        subtitle = null,
        posterType,
        posterColor = null
    }) => {
        const response = await runStoreMutation({
            request: () =>
                api.put(
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
        })
        invalidateChannelsCache()
        invalidateChannelCacheByAlbum(albumId)
        return response
    }

    const confirmChannelCoverUpload = async ({ channelPublicId, objectName, title }) => {
        const response = await runStoreMutation({
            request: () =>
                api.put(
                    `/channels/${channelPublicId}/cover/confirm`,
                    {
                        objectName,
                        title: title?.trim()
                    },
                    { __skipGlobalErrorNotify: true }
                )
        })
        invalidateChannelsCache()
        invalidateChannelCacheById(channelPublicId)
        return response
    }

    const reportMedia = async ({ privateId, reason }) => {
        const res = await runStoreMutation({
            request: () =>
                api.post(
                    `/channels/media/private/${privateId}/report`,
                    {
                        reason: reason?.trim() || null
                    },
                    {
                        __skipGlobalErrorNotify: true
                    }
                )
        })
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
