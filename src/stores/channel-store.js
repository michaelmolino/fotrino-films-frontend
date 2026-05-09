import { ref } from 'vue'
import { defineStore } from 'pinia'
import { defineQueryOptions, useQueryCache } from '@pinia/colada'
import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'
import { withRequestGuard } from 'src/stores/utils/with-request-guard.js'
import { createLatestRequestGuard } from 'src/stores/utils/latest-request-guard.js'

const DEFAULT_CACHE_TIMEOUT = 3600000

const sortChannelDetail = channel => {
    if (!channel) return channel
    const projects = sortBy(channel.projects, 'resourceDate', 'desc').map(project => ({
        ...project,
        media: sortBy(project.media, 'resourceDate', 'desc')
    }))
    return { ...channel, projects }
}

const sortChannelsByTitle = channels => sortBy(channels, 'title', 'desc')

export const useChannelStore = defineStore('channel', () => {
    const channels = ref([])
    const channel = ref(null)
    const loadStatus = ref('idle')
    const upload = ref(null)
    const mediaToken = ref(null)
    const queryCache = useQueryCache()
    const requestGuard = createLatestRequestGuard()

    const setChannelLoadStatus = status => {
        loadStatus.value = status
    }

    const setChannel = nextChannel => {
        channel.value = nextChannel ? { ...nextChannel } : nextChannel
    }

    const setChannels = nextChannels => {
        channels.value = nextChannels
    }

    const setUpload = nextUpload => {
        upload.value = nextUpload
    }

    const setMediaToken = token => {
        mediaToken.value = token
    }

    const guardedFetch = (options) => {
        const wrapper = withRequestGuard(requestGuard)
        return wrapper(fetchAndApplyGet, options)
    }

    const requestUploadInstruction = async url => {
        const res = await api.post(url, null, {
            __skipGlobalErrorNotify: true
        })
        return res.data
    }

    const getChannels = deep => guardedFetch({
        api,
        url: deep ? '/channels/deep' : '/channels',
        apply: setChannels,
        requestKey: 'SET_CHANNELS',
        extract: data => (deep ? sortChannelsByTitle(data).map(sortChannelDetail) : sortChannelsByTitle(data))
    })

    const resolveHistoryChannels = async items => {
        if (!Array.isArray(items) || items.length === 0) {
            return { items: [], deletedUuids: [] }
        }

        const { data } = await api.post('/channels/history', { items }, {
            __skipGlobalErrorNotify: true
        })

        return {
            items: Array.isArray(data?.items) ? data.items : [],
            deletedUuids: Array.isArray(data?.deletedUuids) ? data.deletedUuids : []
        }
    }

    const getChannel = ({ uuid, pending = false }) => {
        const url = `/channels/${uuid}${pending ? '?pending=true' : ''}`
        return guardedFetch({
            api,
            url,
            apply: setChannel,
            requestKey: 'SET_CHANNEL',
            extract: sortChannelDetail,
            onError: error => {
                getGlobalApiErrorPayload(error)
            }
        })
    }

    const getPrivateMedia = privateId => guardedFetch({
        api,
        url: `/channels/media/private/${privateId}`,
        apply: setChannel,
        requestKey: 'SET_CHANNEL',
        onError: error => {
            getGlobalApiErrorPayload(error)
        }
    })

    const fetchChannelRaw = async ({ uuid, pending = false }, timeout = DEFAULT_CACHE_TIMEOUT) => {
        const payload = { uuid, pending }
        const queryOptions = defineQueryOptions(() => ({
            key: ['channel', 'fetchChannelRaw', payload.uuid, payload.pending],
            staleTime: timeout,
            query: async () => {
                const url = `/channels/${payload.uuid}${payload.pending ? '?pending=true' : ''}`
                const { data } = await api.get(url)
                return sortChannelDetail(data)
            }
        }))()

        await queryCache.refresh(queryCache.ensure(queryOptions))
        return queryCache.getQueryData(queryOptions.key)
    }

    const fetchPrivateMediaRaw = async (privateId, timeout = DEFAULT_CACHE_TIMEOUT) => {
        const queryOptions = defineQueryOptions(() => ({
            key: ['channel', 'fetchPrivateMediaRaw', privateId],
            staleTime: timeout,
            query: async () => {
                const { data } = await api.get(`/channels/media/private/${privateId}`)
                return data
            }
        }))()

        await queryCache.refresh(queryCache.ensure(queryOptions))
        return queryCache.getQueryData(queryOptions.key)
    }

    const getMediaToken = ({ privateId }) => guardedFetch({
        api,
        url: `/channels/media/token/${privateId}`,
        apply: setMediaToken,
        requestKey: 'SET_MEDIA_TOKEN',
        extract: data => data.token,
        onError: error => {
            getGlobalApiErrorPayload(error)
        }
    })

    const deleteResource = async resource => {
        const url = resource.type === 'channel'
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

        setChannels([])
        await getChannels(true)
    }

    const postUpload = async payload => {
        try {
            const { data } = await api.post('/channels/media', payload, {
                __skipGlobalErrorNotify: true,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            })
            setUpload(data)
            return data
        } catch (error) {
            setUpload(null)
            getGlobalApiErrorPayload(error)
            throw error
        }
    }

    const confirmUpload = media => api.put(`/channels/media/confirm/${media}`, null, {
        __skipGlobalErrorNotify: true
    })

    const abortUpload = mediaId => api.delete(`/channels/media/${mediaId}/abort`, {
        __skipGlobalErrorNotify: true
    })

    const updateMedia = async ({ mediaId, description = null, resourceDate = null, main }) => {
        try {
            const res = await api.put(`/channels/media/${mediaId}`, {
                description: description?.trim() || null,
                resourceDate: resourceDate?.trim() || null,
                main
            }, {
                __skipGlobalErrorNotify: true
            })
            return res.data
        } catch (error) {
            getGlobalApiErrorPayload(error)
            throw error
        }
    }

    const updateProject = async ({ projectId, subtitle = null, posterType, posterColor = null }) => {
        try {
            const res = await api.put(`/channels/project/${projectId}`, {
                subtitle: subtitle?.trim() || null,
                posterType,
                posterColor
            }, {
                __skipGlobalErrorNotify: true
            })
            return res.data
        } catch (error) {
            getGlobalApiErrorPayload(error)
            throw error
        }
    }

    const updateChannel = async ({ channelUuid, title }) => {
        try {
            const res = await api.put(`/channels/${channelUuid}`, {
                title: title?.trim()
            }, {
                __skipGlobalErrorNotify: true
            })
            return res.data
        } catch (error) {
            getGlobalApiErrorPayload(error)
            throw error
        }
    }

    const requestMediaPreviewUpload = ({ mediaId }) => requestUploadInstruction(`/channels/media/${mediaId}/preview`)

    const requestProjectPosterUpload = ({ projectId }) => requestUploadInstruction(`/channels/project/${projectId}/poster`)

    const requestChannelCoverUpload = ({ channelUuid }) => requestUploadInstruction(`/channels/${channelUuid}/cover`)

    const confirmMediaPreviewUpload = ({ mediaId, objectName, description = null, resourceDate = null, main }) => api.put(
        `/channels/media/${mediaId}/preview/confirm`,
        {
            objectName,
            description: description?.trim() || null,
            resourceDate: resourceDate?.trim() || null,
            main
        },
        { __skipGlobalErrorNotify: true }
    )

    const confirmProjectPosterUpload = ({ projectId, objectName, subtitle = null, posterType, posterColor = null }) => api.put(
        `/channels/project/${projectId}/poster/confirm`,
        {
            objectName,
            subtitle: subtitle?.trim() || null,
            posterType,
            posterColor
        },
        { __skipGlobalErrorNotify: true }
    )

    const confirmChannelCoverUpload = ({ channelUuid, objectName, title }) => api.put(
        `/channels/${channelUuid}/cover/confirm`,
        {
            objectName,
            title: title?.trim()
        },
        { __skipGlobalErrorNotify: true }
    )

    const reportMedia = async ({ privateId, reason }) => {
        const res = await api.post(`/channels/media/private/${privateId}/report`, {
            reason: reason?.trim() || null
        }, {
            __skipGlobalErrorNotify: true
        })
        return res.data
    }

    return {
        channels,
        channel,
        loadStatus,
        upload,
        mediaToken,
        setChannelLoadStatus,
        setChannel,
        getChannels,
        resolveHistoryChannels,
        getChannel,
        getPrivateMedia,
        fetchChannelRaw,
        fetchPrivateMediaRaw,
        getMediaToken,
        deleteResource,
        postUpload,
        confirmUpload,
        abortUpload,
        updateMedia,
        updateProject,
        updateChannel,
        requestMediaPreviewUpload,
        requestProjectPosterUpload,
        requestChannelCoverUpload,
        confirmMediaPreviewUpload,
        confirmProjectPosterUpload,
        confirmChannelCoverUpload,
        reportMedia
    }
})
