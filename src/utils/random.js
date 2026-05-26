let fallbackCounter = 0

function nextFallbackUint32() {
    fallbackCounter = (fallbackCounter + 1) >>> 0

    const perfNow = Math.floor((globalThis.performance?.now?.() || 0) * 1000) >>> 0
    let seed = (Date.now() ^ perfNow ^ fallbackCounter) >>> 0

    seed ^= seed << 13
    seed >>>= 0
    seed ^= seed >>> 17
    seed >>>= 0
    seed ^= seed << 5
    seed >>>= 0

    return seed >>> 0
}

export function randomUUID() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID()
    }
    return null
}

export function randomHex(byteLength = 16) {
    const cryptoObj = globalThis.crypto

    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
        const bytes = new Uint8Array(byteLength)
        cryptoObj.getRandomValues(bytes)
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    const bytes = new Uint8Array(byteLength)
    for (let index = 0; index < byteLength; index += 1) {
        bytes[index] = nextFallbackUint32() & 0xff
    }
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function randomUnitInterval() {
    const cryptoObj = globalThis.crypto
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
        const values = new Uint32Array(1)
        cryptoObj.getRandomValues(values)
        return values[0] / 0x100000000
    }

    return nextFallbackUint32() / 0x100000000
}

export function createRandomId(prefix = null, byteLength = 16) {
    const uuid = randomUUID()
    if (uuid) {
        return prefix ? `${prefix}-${uuid}` : uuid
    }

    const hex = randomHex(byteLength)
    return prefix ? `${prefix}-${hex}` : hex
}
