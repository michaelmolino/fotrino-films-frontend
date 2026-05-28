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

export function assertUploadDraftValidationResponse(data) {
  assertObjectResponse(data, 'Upload draft validation')
  if (typeof data.canSubmit !== 'boolean') {
    throw new TypeError('Upload draft validation response canSubmit must be a boolean')
  }
  if (!Array.isArray(data.blockers)) {
    throw new TypeError('Upload draft validation response blockers must be an array')
  }
  assertObjectResponse(data.requiredFiles, 'Upload draft validation requiredFiles')
  if (typeof data.requiredFiles.upload !== 'boolean') {
    throw new TypeError('Upload draft validation requiredFiles.upload must be a boolean')
  }
  if (typeof data.requiredFiles.preview !== 'boolean') {
    throw new TypeError('Upload draft validation requiredFiles.preview must be a boolean')
  }
  if (typeof data.requiredFiles.cover !== 'boolean') {
    throw new TypeError('Upload draft validation requiredFiles.cover must be a boolean')
  }
  if (typeof data.requiredFiles.poster !== 'boolean') {
    throw new TypeError('Upload draft validation requiredFiles.poster must be a boolean')
  }
}
