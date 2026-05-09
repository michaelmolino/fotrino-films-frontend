import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'
import { createRequestCanceler, isRequestCanceled } from 'src/stores/utils/request-canceler.js'
import { useQueryCache } from '@pinia/colada'

// Sort functions - apply sorting transformations to data structures
const sortChannels = (channels, field = 'title', direction = 'desc') =>
    sortBy(channels, field, direction)

const sortChannelDetail = channel => {
    if (!channel) return channel
    const projects = sortBy(channel.projects, 'resourceDate', 'desc').map(project => ({
        ...project,
        media: sortBy(project.media, 'resourceDate', 'desc')
    }))
    return { ...channel, projects }
}

export const useChannelStore = defineStore('channel', () => {
    const channels = ref([])
    const channel = ref(null)
    const loadStatus = ref('idle')
    const upload = ref(null)
    const mediaToken = ref(null)
    const requestCanceler = createRequestCanceler()

    const queryCache = useQueryCache()

    // Computed property: returns all media across all projects, flattened and sorted
    const sortedAllMedia = computed(() => {
        if (!channel.value?.projects) return []
        return channel.value.projects.flatMap(project =>
            (project.media || []).map(media => ({ media, project }))
        )
    })

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

    const requestUploadInstruction = async url => {
        const res = await api.post(url, null, {
            __skipGlobalErrorNotify: true
        })
        return res.data
    }

    const getChannels = deep => fetchAndApplyGet({
        api,
        url: deep ? '/channels/deep' : '/channels',
        apply: setChannels,
        extract: data => {
            const sorted = sortChannels(data)
            return deep ? sorted.map(sortChannelDetail) : sorted
        }
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

    const getChannel = ({ uuid, pending = false, cache = true }) => {
        const url = `/channels/${uuid}${pending ? '?pending=true' : ''}`
        return fetchAndApplyGet({
            api,
            url,
            apply: setChannel,
            extract: sortChannelDetail,
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
                    queryOptions: channelQueryOptions(uuid),
                    queryCache
                }
            })
        })
    }

    const getPrivateMedia = privateId => fetchAndApplyGet({
        api,
        url: `/channels/media/private/${privateId}`,
        apply: setChannel,
        onError: error => {
            if (!isRequestCanceled(error)) {
                getGlobalApiErrorPayload(error)
            }
        },
        requestConfig: {
            signal: requestCanceler.getSignal('SET_CHANNEL')
        }
    })

    const getMediaToken = ({ privateId }) => fetchAndApplyGet({
        api,
        url: `/channels/media/token/${privateId}`,
        apply: setMediaToken,
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

    const channelQueryOptions = uuid => ({
        key: ['channel', uuid],
        staleTime: 3600000 // 1 hour, adjust as needed
    })

    return {
        channels,
        channel,
        sortedAllMedia,
        loadStatus,
        upload,
        mediaToken,
        setChannelLoadStatus,
        setChannel,
        getChannels,
        resolveHistoryChannels,
        getChannel,
        getPrivateMedia,
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
        reportMedia,
        channelQueryOptions
    }
})
