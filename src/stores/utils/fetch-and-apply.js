/**
 * Fetch data and apply it to state with optional caching.
 * @param {Object} options
 * @param {Object} options.api - Axios instance
 * @param {string} options.url - API endpoint URL
 * @param {Function} options.apply - Function to apply fetched value to state
 * @param {Function} [options.extract] - Optional function to extract data from response
 * @param {Object} [options.requestConfig] - Optional axios request config
 * @param {Function} [options.onError] - Optional error handler
 * @param {Object} [options.cache] - Optional cache config for Pinia Colada
 * @param {Object} options.cache.queryOptions - Query options from defineQueryOptions (must include key)
 * @param {Object} options.cache.queryCache - QueryCache instance from useQueryCache
 * @returns {Promise<*>} The fetched/cached value
 */
const getStaleTimeMs = queryOptions =>
  Number.isFinite(queryOptions?.staleTime) ? Number(queryOptions.staleTime) : 0

const getFreshCachedValue = ({ queryOptions, queryCache }) => {
  const cached = queryCache.getQueryData(queryOptions.key)
  if (cached?.__fetchAndApplyCached !== true) {
    return { hit: false, value: null }
  }

  const staleTime = getStaleTimeMs(queryOptions)
  const ageMs = Date.now() - cached.cachedAt
  const isFresh = staleTime > 0 && ageMs >= 0 && ageMs < staleTime

  if (!isFresh) {
    return { hit: false, value: null }
  }

  return { hit: true, value: cached.value }
}

const setCachedValue = ({ queryOptions, queryCache }, value) => {
  queryCache.setQueryData(queryOptions.key, {
    __fetchAndApplyCached: true,
    value,
    cachedAt: Date.now()
  })
}

export const fetchAndApplyGet = async ({
  api,
  url,
  apply,
  extract,
  requestConfig,
  onError,
  cache
}) => {
  try {
    let value

    if (cache) {
      const cached = getFreshCachedValue(cache)
      if (cached.hit) {
        apply(cached.value)
        return cached.value
      }

      // Not in cache, fetch from API
      const { data } = await api.get(url, requestConfig)
      value = extract ? extract(data) : data
      setCachedValue(cache, value)
    } else {
      // Regular fetch without cache
      const { data } = await api.get(url, requestConfig)
      value = extract ? extract(data) : data
    }

    apply(value)
    return value
  } catch (error) {
    apply(null)
    if (typeof onError === 'function') {
      const maybe = onError(error)
      if (maybe !== undefined) {
        return maybe
      }
    }
    throw error
  }
}
