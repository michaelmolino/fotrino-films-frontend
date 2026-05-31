function randomHex(byteLength = 16) {
  const cryptoObj = globalThis.crypto
  const bytes = new Uint8Array(byteLength)

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes)
  } else {
    for (let index = 0; index < byteLength; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
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

  return Math.random()
}

export function createRandomId(prefix = null, byteLength = 16) {
  const hex = randomHex(byteLength)
  return prefix ? `${prefix}-${hex}` : hex
}
