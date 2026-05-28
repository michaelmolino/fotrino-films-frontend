function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function assertArrayResponse(data, context) {
  if (!Array.isArray(data)) {
    throw new TypeError(`${context} response must be an array`)
  }
}

export function assertObjectResponse(data, context) {
  if (!isPlainObject(data)) {
    throw new TypeError(`${context} response must be an object`)
  }
}

export function assertAccountProfileResponse(data) {
  assertObjectResponse(data, 'Account profile')
}

export function assertAccountProvidersResponse(data) {
  assertObjectResponse(data, 'Account providers')
  if (!Array.isArray(data.providers)) {
    throw new TypeError('Account providers response must include a providers array')
  }
}

export function assertHistoryResolveResponse(data) {
  assertObjectResponse(data, 'History resolve')
  if (data.items != null && !Array.isArray(data.items)) {
    throw new TypeError('History resolve response items must be an array')
  }
  if (data.deletedItems != null && !Array.isArray(data.deletedItems)) {
    throw new TypeError('History resolve response deletedItems must be an array')
  }
}

export function assertChannelViewResponse(data) {
  assertObjectResponse(data, 'Channel view')
  if (!Object.hasOwn(data, 'data')) {
    throw new TypeError('Channel view response must include data')
  }
  if (!Object.hasOwn(data, 'readModel')) {
    throw new TypeError('Channel view response must include readModel')
  }
}
