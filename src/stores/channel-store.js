import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { sortBy } from '@utils/sort.js'
import { getGlobalApiErrorPayload } from 'src/utils/api-errors.js'
import { normalizeChannelPayload, sortChannelDetail } from 'src/utils/read-model.js'
import { fetchAndApplyGet } from 'src/stores/utils/fetch-and-apply.js'
import { createRequestCanceler, isRequestCanceled } from 'src/stores/utils/request-canceler.js'
import { useQueryCache } from '@pinia/colada'

// Sort functions - apply sorting transformations to data structures
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
        const normalized = normalizeChannelPayload(nextChannel)
        channel.value = normalized.channel
        readModel.value = normalized.readModel
    }

    const setChannels = nextChannels => {
        channels.value = nextChannels
    }

    const setUpload = nextUpload => {
        upload.value = nextUpload
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

    // Normalized entities by publicId from read model (O(1) lookups)
    const channelsByPublicId = computed(() => readModel.value?.entities?.channelsByPublicId || {})
    const projectsByPublicId = computed(() => readModel.value?.entities?.projectsByPublicId || {})
    const mediaByPublicId = computed(() => readModel.value?.entities?.mediaByPublicId || {})

    // Map of hydrated projects (with media arrays) from denormalized channel tree
    const hydratedProjectsByPublicId = computed(() => {
        const map = {}
        for (const project of channel.value?.projects || []) {
            if (project?.publicId) {
                map[project.publicId] = project
            }
        }
        const privateProject = channel.value?.project
        if (privateProject?.publicId && !map[privateProject.publicId]) {
            map[privateProject.publicId] = privateProject
        }
        return map
    })

    /** Get hydrated project by publicId. Returns project with media array and metadata. */
    const getProjectByPublicId = projectPublicId => {
        if (!projectPublicId) return null
        return hydratedProjectsByPublicId.value?.[projectPublicId] || projectsByPublicId.value?.[projectPublicId] || null
    }

    /** Get media entity by publicId from normalized read model. */
    const getMediaByPublicId = mediaPublicId => mediaByPublicId.value?.[mediaPublicId] || null

    /** Get project by media publicId by traversing read-model relationships. */
    const getProjectByMediaPublicId = mediaPublicId => {
        const media = getMediaByPublicId(mediaPublicId)
        const projectPublicId = media?.projectPublicId
        if (!projectPublicId) return null
        return getProjectByPublicId(projectPublicId)
    }

    const resolveHistoryChannels = async items => {
        if (!Array.isArray(items) || items.length === 0) {
            return { items: [], deletedPublicIds: [] }
        }

        const { data } = await api.post('/channels/history', { items }, {
            __skipGlobalErrorNotify: true
        })

        return {
            items: Array.isArray(data?.items) ? data.items : [],
            deletedPublicIds: Array.isArray(data?.deletedPublicIds) ? data.deletedPublicIds : []
        }
    }

    const getChannel = ({ channelId, pending = false, cache = true }) => {
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

    const getChannelByProject = projectId => fetchAndApplyGet({
        api,
        url: `/channels/project/${projectId}`,
        apply: setChannel,
        extract: payload => payload,
        onError: error => {
            if (!isRequestCanceled(error)) {
                getGlobalApiErrorPayload(error)
            }
        },
        requestConfig: {
            signal: requestCanceler.getSignal('SET_CHANNEL')
        }
    })

    const getChannelByMedia = mediaId => fetchAndApplyGet({
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
        }
    })

    const getPrivateMedia = privateMediaId => fetchAndApplyGet({
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
        }
    })

    const createMediaSession = async ({ privateId }) => {
        const res = await api.post(`/channels/media/session/${privateId}`)
        return res.data
    }

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

    const updateChannel = async ({ channelPublicId, title }) => {
        try {
            const res = await api.put(`/channels/${channelPublicId}`, {
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

    const requestChannelCoverUpload = ({ channelPublicId }) => requestUploadInstruction(`/channels/${channelPublicId}/cover`)

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

    const confirmChannelCoverUpload = ({ channelPublicId, objectName, title }) => api.put(
        `/channels/${channelPublicId}/cover/confirm`,
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
        readModel,
        channelsByPublicId,
        projectsByPublicId,
        mediaByPublicId,
        sortedAllMedia,
        loadStatus,
        upload,
        setChannelLoadStatus,
        setChannel,
        getChannels,
        getProjectByPublicId,
        getMediaByPublicId,
        getProjectByMediaPublicId,
        resolveHistoryChannels,
        getChannel,
        getChannelByProject,
        getChannelByMedia,
        getPrivateMedia,
        createMediaSession,
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
