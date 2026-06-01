import { api } from 'src/clients/axios-client.js'

const identity = value => value

export function invalidateQueriesSafely(queryCache, options) {
  queryCache.invalidateQueries(options).catch(() => { })
}

export function createApiGetQueryOptionsFactory({
  key,
  staleTime,
  url,
  config,
  transform = identity
}) {
  return (...args) => ({
    key: typeof key === 'function' ? key(...args) : key,
    staleTime: typeof staleTime === 'function' ? staleTime(...args) : staleTime,
    query: async () => {
      const resolvedUrl = typeof url === 'function' ? url(...args) : url
      const resolvedConfig = typeof config === 'function' ? config(...args) : config
      const { data } = await api.get(resolvedUrl, resolvedConfig)
      return transform(data, ...args)
    }
  })
}

export function toArray(value) {
  return Array.isArray(value) ? value : []
}
