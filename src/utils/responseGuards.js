function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function assertDataEnvelopeResponse(data, context) {
  assertObjectResponse(data, context)
  if (!Object.hasOwn(data, 'data')) {
    throw new TypeError(`${context} response must include data`)
  }
}

export function assertDataEnvelopeArrayResponse(data, context) {
  assertDataEnvelopeResponse(data, context)
  if (!Array.isArray(data.data)) {
    throw new TypeError(`${context} response data must be an array`)
  }
}

export function assertObjectResponse(data, context) {
  if (!isPlainObject(data)) {
    throw new TypeError(`${context} response must be an object`)
  }
}

export function assertAccountProfileResponse(data) {
  assertDataEnvelopeResponse(data, 'Account profile')
}

export function assertAccountProvidersResponse(data) {
  assertDataEnvelopeResponse(data, 'Account providers')
  if (!Array.isArray(data.data)) {
    throw new TypeError('Account providers response data must be an array')
  }
}

export function assertHistoryResolveResponse(data) {
  assertDataEnvelopeResponse(data, 'History resolve')
  if (data.data?.items != null && !Array.isArray(data.data.items)) {
    throw new TypeError('History resolve response items must be an array')
  }
  if (data.data?.deletedItems != null && !Array.isArray(data.data.deletedItems)) {
    throw new TypeError('History resolve response deletedItems must be an array')
  }
}

export function assertChannelViewResponse(data) {
  assertDataEnvelopeResponse(data, 'Channel view')
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
