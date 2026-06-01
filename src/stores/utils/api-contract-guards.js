function toObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function formatContractLabel(contractName) {
    return typeof contractName === 'string' && contractName.trim().length > 0
        ? ` (${contractName.trim()})`
        : ''
}

export function ensureApiEnvelope(payload, { url = 'unknown', contractName = null } = {}) {
    const objectPayload = toObject(payload)
    if (!objectPayload) {
        throw new TypeError(`Expected object API payload for ${url}${formatContractLabel(contractName)}.`)
    }

    if (!Object.hasOwn(objectPayload, 'data')) {
        throw new TypeError(
            `Expected envelope payload with top-level data key for ${url}${formatContractLabel(contractName)}.`
        )
    }

    return objectPayload
}

export function ensureUploadDraftPayload(payload, { url = 'unknown' } = {}) {
    const data = toObject(payload)
    if (!data) {
        throw new TypeError(`Expected object upload draft payload for ${url}.`)
    }

    const mediaPrivateId = data.mediaPrivateId
    if (mediaPrivateId !== null && typeof mediaPrivateId !== 'string') {
        throw new TypeError(`Expected mediaPrivateId to be a string or null for ${url}.`)
    }

    if (!Array.isArray(data.instructions)) {
        throw new TypeError(`Expected upload draft instructions array for ${url}.`)
    }

    for (const instruction of data.instructions) {
        const objectInstruction = toObject(instruction)
        if (!objectInstruction) {
            throw new TypeError(`Expected each upload instruction to be an object for ${url}.`)
        }

        if (typeof objectInstruction.resourceType !== 'string') {
            throw new TypeError(`Expected upload instruction resourceType for ${url}.`)
        }
        if (typeof objectInstruction.reference !== 'string') {
            throw new TypeError(`Expected upload instruction reference for ${url}.`)
        }
        if (typeof objectInstruction.url !== 'string') {
            throw new TypeError(`Expected upload instruction url for ${url}.`)
        }
    }

    return data
}

export function ensureUploadValidationPayload(payload, { url = 'unknown' } = {}) {
    const data = toObject(payload)
    if (!data) {
        throw new TypeError(`Expected object upload validation payload for ${url}.`)
    }

    if (typeof data.canSubmit !== 'boolean') {
        throw new TypeError(`Expected canSubmit boolean in upload validation payload for ${url}.`)
    }

    if (!Array.isArray(data.blockers) || data.blockers.some(item => typeof item !== 'string')) {
        throw new TypeError(`Expected blockers string array in upload validation payload for ${url}.`)
    }

    return data
}

export function ensureHistoryResponsePayload(payload, { url = 'unknown' } = {}) {
    const data = toObject(payload)
    if (!data) {
        throw new TypeError(`Expected object history payload for ${url}.`)
    }

    if (data.items != null && !Array.isArray(data.items)) {
        throw new TypeError(`Expected items array in history payload for ${url}.`)
    }
    if (data.deletedItems != null && !Array.isArray(data.deletedItems)) {
        throw new TypeError(`Expected deletedItems array in history payload for ${url}.`)
    }
    if (data.persistedItems != null && !Array.isArray(data.persistedItems)) {
        throw new TypeError(`Expected persistedItems array in history payload for ${url}.`)
    }

    return data
}

export function ensureMediaSessionPayload(payload, { url = 'unknown' } = {}) {
    const data = toObject(payload)
    if (!data) {
        throw new TypeError(`Expected object media session payload for ${url}.`)
    }

    if (typeof data.playbackUrl !== 'string') {
        throw new TypeError(`Expected playbackUrl string in media session payload for ${url}.`)
    }
    if (typeof data.issuedAt !== 'number') {
        throw new TypeError(`Expected issuedAt number in media session payload for ${url}.`)
    }
    if (typeof data.expiresAt !== 'number') {
        throw new TypeError(`Expected expiresAt number in media session payload for ${url}.`)
    }
    if (typeof data.ttlSeconds !== 'number') {
        throw new TypeError(`Expected ttlSeconds number in media session payload for ${url}.`)
    }

    return data
}

export function ensureReportMediaPayload(payload, { url = 'unknown' } = {}) {
    const data = toObject(payload)
    if (!data) {
        throw new TypeError(`Expected object report-media payload for ${url}.`)
    }

    if (typeof data.reported !== 'boolean') {
        throw new TypeError(`Expected reported boolean in report-media payload for ${url}.`)
    }
    if (data.message != null && typeof data.message !== 'string') {
        throw new TypeError(`Expected optional message string in report-media payload for ${url}.`)
    }

    return data
}
