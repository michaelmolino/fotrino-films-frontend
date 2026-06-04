let supportsWebP = false
let supportInitialized = false
let supportInitPromise = null

function detectWebPSupport() {
    return new Promise(resolve => {
        const webp = new Image()
        webp.onload = webp.onerror = function () {
            resolve(webp.height === 2)
        }
        webp.src =
            'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
}

export async function initializeImageAssetSupport() {
    if (supportInitialized) return supportsWebP
    if (supportInitPromise) return supportInitPromise

    supportInitPromise = detectWebPSupport().then(result => {
        supportsWebP = result
        supportInitialized = true
        return supportsWebP
    })

    return supportInitPromise
}

export function isWebPSupported() {
    return supportsWebP
}

export function resolveImagePrimaryUrl(imageOrAsset) {
    if (!Array.isArray(imageOrAsset)) return null

    let webpUrl = null
    let jpegUrl = null

    for (const entry of imageOrAsset) {
        if (!entry || typeof entry.key !== 'string' || !entry.key) continue
        const type = String(entry.type || '').toLowerCase()
        if (type === 'webp' && !webpUrl) webpUrl = entry.key
        if ((type === 'jpeg' || type === 'jpg') && !jpegUrl) jpegUrl = entry.key
    }

    if (supportsWebP && webpUrl) return webpUrl
    return jpegUrl
}
