import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/clients/axios-client.js'
import { useQueryCache } from '@pinia/colada'
import { mutationResult, runMutation } from 'src/utils/store-mutations.js'
import { assertUploadDraftValidationResponse } from 'src/utils/response-guards.js'

export const useUploadStore = defineStore('upload', () => {
  const upload = ref(null)
  const queryCache = useQueryCache()

  const CANCELLED = Symbol('cancelled')

  const setUpload = value => {
    upload.value = value
  }

  const invalidateQueries = options => {
    queryCache.invalidateQueries(options).catch(() => {})
  }

  const invalidateChannelsCache = () => {
    invalidateQueries({ key: ['channels', 'flat'], exact: true })
  }

  const invalidateChannelCacheById = channelPublicId => {
    if (!channelPublicId) return
    invalidateQueries({
      predicate: query => query.key?.[0] === 'channel' && query.key?.[1] === channelPublicId
    })
  }

  const invalidateChannelCacheByAlbum = albumRecordId => {
    if (!albumRecordId) return
    invalidateQueries({ key: ['channel', 'album', albumRecordId], exact: true })
  }

  const invalidateChannelCacheByMedia = mediaRecordId => {
    if (!mediaRecordId) return
    invalidateQueries({ key: ['channel', 'media', mediaRecordId], exact: true })
  }

  const requestUploadInstruction = async url => {
    const res = await api.post(url)
    return mutationResult({ ok: true, data: res.data })
  }

  const postUploadDraft = async draftRequest => {
    const response = await runMutation({
      request: () =>
        api.post('/uploads/media/drafts', draftRequest, {
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
      mediaPrivateId: data?.mediaPrivateId ?? null,
      instructions: data.instructions
    }

    setUpload(normalizedData.instructions)
    return mutationResult({ ok: true, data: normalizedData })
  }

  const validateUploadDraft = async draftRequest => {
    const response = await runMutation({
      request: () =>
        api.post('/uploads/media/drafts/validate', draftRequest, {
          __policy: {
            loading: 'none'
          },
          __responseGuard: assertUploadDraftValidationResponse,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        })
    })

    return mutationResult({ ok: true, data: response?.data || { canSubmit: false, blockers: [] } })
  }

  const confirmUpload = async mediaPrivateId => {
    await runMutation({
      request: () => api.put(`/uploads/media/confirm/${mediaPrivateId}`)
    })
    invalidateChannelsCache()
    invalidateChannelCacheByMedia(mediaPrivateId)
    return mutationResult({ ok: true })
  }

  const abortUpload = async mediaPrivateId => {
    const response = await runMutation({
      request: () => api.delete(`/uploads/media/${mediaPrivateId}/abort`),
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
    return mutationResult({ ok: true })
  }

  const requestMediaPreviewUpload = ({ mediaPrivateId }) =>
    requestUploadInstruction(`/uploads/media/${mediaPrivateId}/preview`)

  const requestAlbumPosterUpload = ({ albumPrivateId }) =>
    requestUploadInstruction(`/uploads/album/${albumPrivateId}/poster`)

  const requestChannelCoverUpload = ({ channelPublicId }) =>
    requestUploadInstruction(`/uploads/${channelPublicId}/cover`)

  const confirmMediaPreviewUpload = async ({
    mediaPrivateId,
    mediaPublicId = null,
    objectName,
    title,
    description = null,
    resourceDate = null,
    main
  }) => {
    const response = await runMutation({
      request: () =>
        api.put(`/uploads/media/${mediaPrivateId}/preview/confirm`, {
          objectName,
          title: title?.trim(),
          description: description?.trim() || null,
          resourceDate: resourceDate?.trim() || null,
          main
        })
    })
    invalidateChannelsCache()
    if (mediaPublicId) invalidateChannelCacheByMedia(mediaPublicId)
    return mutationResult({ ok: true, data: response?.data ?? null })
  }

  const confirmAlbumPosterUpload = async ({
    albumPrivateId,
    albumPublicId = null,
    objectName,
    title,
    subtitle = null,
    posterType,
    posterColor = null
  }) => {
    const response = await runMutation({
      request: () =>
        api.put(`/uploads/album/${albumPrivateId}/poster/confirm`, {
          objectName,
          title: title?.trim(),
          subtitle: subtitle?.trim() || null,
          posterType,
          posterColor
        })
    })
    invalidateChannelsCache()
    if (albumPublicId) invalidateChannelCacheByAlbum(albumPublicId)
    return mutationResult({ ok: true, data: response?.data ?? null })
  }

  const confirmChannelCoverUpload = async ({ channelPublicId, objectName, title }) => {
    const response = await runMutation({
      request: () =>
        api.put(`/uploads/${channelPublicId}/cover/confirm`, {
          objectName,
          title: title?.trim()
        })
    })
    invalidateChannelsCache()
    invalidateChannelCacheById(channelPublicId)
    return mutationResult({ ok: true, data: response?.data ?? null })
  }

  return {
    upload,
    postUploadDraft,
    validateUploadDraft,
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
