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
      // Use Pinia Colada cache
      const { queryOptions, queryCache } = cache
      // Make the API call
      const { data } = await api.get(url, requestConfig)
      value = extract ? extract(data) : data
      // Update Colada cache with the result
      queryCache.setQueryData(queryOptions.key, value)
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
