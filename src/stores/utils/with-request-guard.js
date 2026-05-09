/**
 * Higher-order wrapper that adds request deduplication to fetchAndApplyGet.
 * Ensures only the latest request's response is applied to state.
 * @param {Object} requestGuard - Request guard instance from createLatestRequestGuard
 * @returns {Function} Wrapped function that applies request staleness checking
 */
export const withRequestGuard = (requestGuard) => {
    return async (fetchAndApplyGetFn, options) => {
        const requestKey = options.requestKey || (options.apply ? options.url : `${options.url}:read`)
        const requestId = requestGuard.begin(requestKey)

        try {
            const value = await fetchAndApplyGetFn(options)
            if (!requestGuard.isLatest(requestKey, requestId)) {
                return null
            }
            return value
        } catch (error) {
            if (!requestGuard.isLatest(requestKey, requestId)) {
                return null
            }
            throw error
        }
    }
}
