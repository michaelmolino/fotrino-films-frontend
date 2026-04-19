const GLOBAL_API_ERROR_CODES = new Set([
    'bad_request',
    'unauthorized',
    'forbidden',
    'not_found',
    'conflict',
    'unprocessable_entity',
    'internal_server_error'
])

const DEFAULT_GLOBAL_API_ERROR_MESSAGES = {
    bad_request: 'Bad request.',
    unauthorized: 'Unauthorised. Please login.',
    forbidden: 'Forbidden.',
    not_found: 'Not found.',
    conflict: 'Conflict.',
    unprocessable_entity: 'Unprocessable entity.',
    internal_server_error: 'Internal server error.'
}

/**
 * @typedef {import('src/types/api-contract').BadRequestErrorResponse |
 * import('src/types/api-contract').UnauthorizedErrorResponse |
 * import('src/types/api-contract').ForbiddenErrorResponse |
 * import('src/types/api-contract').NotFoundErrorResponse |
 * import('src/types/api-contract').ConflictErrorResponse |
 * import('src/types/api-contract').UnprocessableEntityErrorResponse |
 * import('src/types/api-contract').InternalServerErrorResponse} GlobalApiErrorResponse
 */

/** @typedef {GlobalApiErrorResponse['error']} GlobalApiErrorCode */

/**
 * @typedef {import('src/types/api-contract').UploadValidationErrorResponse |
 * import('src/types/api-contract').UploadStorageConflictResponse |
 * import('src/types/api-contract').DeletionBlockedResponse} ComponentApiErrorResponse
 */

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {unknown} error
 * @returns {GlobalApiErrorResponse | null}
 */
export function getGlobalApiErrorPayload(error) {
    const data = error?.response?.data
    if (!isPlainObject(data)) {
        return null
    }

    if (typeof data.status !== 'number' || typeof data.error !== 'string') {
        return null
    }

    if (!GLOBAL_API_ERROR_CODES.has(data.error)) {
        return null
    }

    if (data.message != null && typeof data.message !== 'string') {
        return null
    }

    return /** @type {GlobalApiErrorResponse} */ (data)
}

/**
 * @param {unknown} error
 * @returns {ComponentApiErrorResponse | null}
 */
export function getComponentApiErrorPayload(error) {
    const data = error?.response?.data
    if (!isPlainObject(data) || typeof data.error !== 'string') {
        return null
    }

    if (Array.isArray(data.detail) && data.error === 'Invalid upload request') {
        return /** @type {import('src/types/api-contract').UploadValidationErrorResponse} */ (data)
    }

    if (typeof data.detail === 'string' && data.error === 'Upload not complete') {
        return /** @type {import('src/types/api-contract').UploadStorageConflictResponse} */ (data)
    }

    if (data.detail == null && !('status' in data)) {
        return /** @type {import('src/types/api-contract').DeletionBlockedResponse} */ (data)
    }

    return null
}

function getUploadValidationMessage(payload) {
    const [firstDetail] = payload.detail || []
    if (typeof firstDetail?.msg === 'string' && firstDetail.msg) {
        return firstDetail.msg
    }

    return 'Invalid upload request.'
}

/**
 * @param {unknown} error
 * @param {GlobalApiErrorCode} code
 * @returns {boolean}
 */
export function isGlobalApiError(error, code) {
    return getGlobalApiErrorPayload(error)?.error === code
}

/**
 * @param {unknown} error
 * @param {string} [fallback='Something went wrong!']
 * @returns {string}
 */
export function getGlobalApiErrorMessage(error, fallback = 'Something went wrong!') {
    const payload = getGlobalApiErrorPayload(error)
    if (!payload) {
        return fallback
    }

    return payload.message || DEFAULT_GLOBAL_API_ERROR_MESSAGES[payload.error] || fallback
}

/**
 * @param {unknown} error
 * @param {string} [fallback='Something went wrong!']
 * @returns {string}
 */
export function getComponentApiErrorMessage(error, fallback = 'Something went wrong!') {
    const globalPayload = getGlobalApiErrorPayload(error)
    if (globalPayload) {
        return getGlobalApiErrorMessage(error, fallback)
    }

    const payload = getComponentApiErrorPayload(error)
    if (!payload) {
        return fallback
    }

    if (Array.isArray(payload.detail)) {
        return getUploadValidationMessage(payload)
    }

    if (typeof payload.detail === 'string' && payload.detail) {
        return payload.detail
    }

    return payload.error || fallback
}