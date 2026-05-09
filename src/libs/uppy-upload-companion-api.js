import { api } from 'boot/axios'

export function getMultipartMediaId(file) {
    const mediaId = file.meta?.reference
    if (!mediaId) {
        throw new Error('Missing media reference for multipart upload')
    }
    return mediaId
}

async function requestMultipartJson(url, { method = 'GET', body, headers = {} } = {}) {
    try {
        const response = await api.request({
            url,
            method,
            data: body,
            headers,
            __skipGlobalErrorNotify: true,
            __skipRequestLoading: true,
            __skipDeleteConfirm: true
        })
        return response?.data ?? null
    } catch (error) {
        const status = error?.response?.status
        throw new Error(`${method} ${url} failed: ${status ?? 'network error'}`)
    }
}

export function createMultipartCompanionApi({ multipartBaseUrl = '/api/channels/media' } = {}) {
    return {
        createMultipartUpload(mediaId) {
            return requestMultipartJson(`${multipartBaseUrl}/${mediaId}/multipart`, {
                method: 'POST'
            })
        },
        listParts(mediaId, uploadId) {
            return requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}`
            )
        },
        signPart(mediaId, uploadId, partNumber) {
            return requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}/sign/${partNumber}`
            )
        },
        completeMultipartUpload(mediaId, uploadId, parts) {
            return requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { parts }
                }
            )
        },
        abortMultipartUpload(mediaId, uploadId) {
            return requestMultipartJson(
                `${multipartBaseUrl}/${mediaId}/multipart/${encodeURIComponent(uploadId)}`,
                {
                    method: 'DELETE'
                }
            )
        }
    }
}
