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

export function resolveImagePrimaryUrl(imageAssets) {
    if (!Array.isArray(imageAssets)) return null

    let webpUrl = null
    let jpegUrl = null

    for (const asset of imageAssets) {
        const key = asset.key

        const type = String(asset.type || '').toLowerCase()
        if (!webpUrl && type === 'webp') webpUrl = key
        if (!jpegUrl && (type === 'jpeg')) jpegUrl = key
    }

    return (supportsWebP && webpUrl) || jpegUrl
}
