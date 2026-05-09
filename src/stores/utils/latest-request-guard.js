export const createLatestRequestGuard = () => {
  const latestRequestByKey = new Map()

  const begin = requestKey => {
    const nextId = (latestRequestByKey.get(requestKey) || 0) + 1
    latestRequestByKey.set(requestKey, nextId)
    return nextId
  }

  const isLatest = (requestKey, requestId) => latestRequestByKey.get(requestKey) === requestId

  return {
    begin,
    isLatest
  }
}
