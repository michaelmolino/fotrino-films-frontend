import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
import { useQueryCache } from '@pinia/colada'

export const useUploadStore = defineStore('upload', () => {
    const upload = ref(null)
    const queryCache = useQueryCache()

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
            throw error
        }
    }

    const mutationResult = ({ ok, data = null, cancelled = false }) => ({
        ok,
        data,
        cancelled
    })

    const CANCELLED = Symbol('cancelled')

    const setUpload = value => {
        upload.value = value
    }

    const invalidateChannelsCache = () => {
        void queryCache.invalidateQueries({ key: ['channels', 'flat'], exact: true })
        void queryCache.invalidateQueries({ key: ['channels', 'deep'], exact: true })
    }

    const invalidateChannelCacheById = channelId => {
        if (!channelId) return
        void queryCache.invalidateQueries({
            predicate: query => query.key?.[0] === 'channel' && query.key?.[1] === channelId
        })
    }

    const invalidateChannelCacheByAlbum = albumId => {
        if (!albumId) return
        void queryCache.invalidateQueries({ key: ['channel', 'album', albumId], exact: true })
    }

    const invalidateChannelCacheByMedia = mediaId => {
        if (!mediaId) return
        void queryCache.invalidateQueries({ key: ['channel', 'media', mediaId], exact: true })
    }

    const requestUploadInstruction = async url => {
        const res = await api.post(url, null, {
            __skipGlobalErrorNotify: true
        })
        return mutationResult({ ok: true, data: res.data })
    }

    const postUploadDraft = async payload => {
        const response = await runStoreMutation({
            request: () =>
                api.post('/uploads/media/draft', payload, {
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
            instructions: data.instructions
        }

        setUpload(normalizedData.instructions)
        return mutationResult({ ok: true, data: normalizedData })
    }

    const confirmUpload = async media => {
        await runStoreMutation({
            request: () =>
                api.put(`/uploads/media/confirm/${media}`, null, {
                    __skipGlobalErrorNotify: true
                })
        })
        invalidateChannelsCache()
        invalidateChannelCacheByMedia(media)
        return mutationResult({ ok: true })
    }

    const abortUpload = async mediaId => {
        const response = await runStoreMutation({
            request: () =>
                api.delete(`/uploads/media/${mediaId}/abort`, {
                    __skipGlobalErrorNotify: true
                }),
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
        invalidateChannelCacheByMedia(mediaId)
        return mutationResult({ ok: true })
    }

    const requestMediaPreviewUpload = ({ mediaId }) =>
        requestUploadInstruction(`/uploads/media/${mediaId}/preview`)

    const requestAlbumPosterUpload = ({ albumId }) =>
        requestUploadInstruction(`/uploads/album/${albumId}/poster`)

    const requestChannelCoverUpload = ({ channelPublicId }) =>
        requestUploadInstruction(`/uploads/${channelPublicId}/cover`)

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
                    `/uploads/media/${mediaId}/preview/confirm`,
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
        return mutationResult({ ok: true, data: response?.data ?? null })
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
                    `/uploads/album/${albumId}/poster/confirm`,
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
        return mutationResult({ ok: true, data: response?.data ?? null })
    }

    const confirmChannelCoverUpload = async ({ channelPublicId, objectName, title }) => {
        const response = await runStoreMutation({
            request: () =>
                api.put(
                    `/uploads/${channelPublicId}/cover/confirm`,
                    {
                        objectName,
                        title: title?.trim()
                    },
                    { __skipGlobalErrorNotify: true }
                )
        })
        invalidateChannelsCache()
        invalidateChannelCacheById(channelPublicId)
        return mutationResult({ ok: true, data: response?.data ?? null })
    }

    return {
        upload,
        postUploadDraft,
        confirmUpload,
        abortUpload,
        requestMediaPreviewUpload,
        requestAlbumPosterUpload,
        requestChannelCoverUpload,
        confirmMediaPreviewUpload,
        confirmAlbumPosterUpload,
        confirmChannelCoverUpload
    }
})