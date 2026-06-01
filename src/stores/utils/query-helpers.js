import { api } from 'src/clients/axios-client.js'
import { ensureApiEnvelope } from 'src/stores/utils/api-contract-guards.js'

const identity = value => value

export function invalidateQueriesSafely(queryCache, options) {
  queryCache.invalidateQueries(options).catch(() => {})
}

export function createApiGetQueryOptionsFactory({
  key,
  staleTime,
  url,
  config,
  transform = identity,
  enforceEnvelope = false,
  contractName = null
}) {
  return (...args) => ({
    key: typeof key === 'function' ? key(...args) : key,
    staleTime: typeof staleTime === 'function' ? staleTime(...args) : staleTime,
    query: async () => {
      const resolvedUrl = typeof url === 'function' ? url(...args) : url
      const resolvedConfig = typeof config === 'function' ? config(...args) : config
      const resolvedContractName =
        typeof contractName === 'function' ? contractName(...args) : contractName
      const { data } = await api.get(resolvedUrl, resolvedConfig)
      const guardedData =
        enforceEnvelope || resolvedContractName
          ? ensureApiEnvelope(data, {
              url: resolvedUrl,
              contractName: resolvedContractName
            })
          : data

      return transform(guardedData, ...args)
    }
  })
}

export function toArray(value) {
  return Array.isArray(value) ? value : []
}
