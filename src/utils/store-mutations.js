export const runMutation = async ({ request, onSuccess, onError }) => {
    if (typeof request !== 'function') {
        throw new TypeError('Mutation request must be a function.')
    }

    try {
        const result = await request()
        if (typeof onSuccess === 'function') {
            await onSuccess(result)
        }
        return result
    } catch (error) {
        if (typeof onError === 'function') {
            const maybe = await onError(error)
            if (maybe !== undefined) {
                return maybe
            }
        }
        throw error
    }
}

export const mutationResult = ({ ok, data = null, cancelled = false }) => ({
    ok,
    data,
    cancelled
})