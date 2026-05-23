/**
 * Simple request canceler that aborts previous in-flight requests by key.
 * Pass the signal to axios requestConfig; axios automatically handles cancellation.
 */
export const createRequestCanceler = () => {
  const controllerByKey = new Map()

  const getSignal = requestKey => {
    const previous = controllerByKey.get(requestKey)
    if (previous) {
      previous.abort()
    }

    const controller = new AbortController()
    controllerByKey.set(requestKey, controller)
    return controller.signal
  }

  return { getSignal }
}

export const isRequestCanceled = error =>
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
