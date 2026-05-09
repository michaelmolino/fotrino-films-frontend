export function assertUploadResult(result, requiredResourceTypes = []) {
    if (result.failed?.length) {
        const failedNames = result.failed
            .map(file => {
                const message = file?.error?.message
                return message ? `${file.name} (${message})` : file.name
            })
            .join(', ')
        throw new Error(`Upload failed for: ${failedNames}`)
    }

    const successful = result.successful || []
    if (successful.length === 0) {
        throw new Error('Uploader reported zero successful uploads.')
    }

    if (requiredResourceTypes.length > 0) {
        const successfulTypes = new Set(successful.map(file => file.meta?.resourceType))
        const missingTypes = requiredResourceTypes.filter(type => !successfulTypes.has(type))
        if (missingTypes.length > 0) {
            throw new Error(`Missing successful uploads for: ${missingTypes.join(', ')}`)
        }
    }
}

function isEmptyUploadResult(result) {
    const successful = result?.successful || []
    const failed = result?.failed || []
    return successful.length === 0 && failed.length === 0
}

export async function uploadAndAssert(uppy, requiredResourceTypes = []) {
    let result = await uppy.upload()

    // Occasionally the first call can resolve before files transition
    // into a started upload state. Retry once, which mirrors the manual
    // "Retry Upload" behavior users reported as successful.
    if (isEmptyUploadResult(result)) {
        result = await uppy.upload()
    }

    assertUploadResult(result, requiredResourceTypes)
    return result
}
