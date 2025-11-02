import { ref } from 'vue'

const supportsWebP = ref(null)
const checkedUrls = new Map()

// Detect WebP support once
async function detectWebPSupport() {
    if (supportsWebP.value !== null) return supportsWebP.value

    return new Promise(resolve => {
        const webp = new Image()
        webp.onload = webp.onerror = function () {
            supportsWebP.value = webp.height === 2
            resolve(supportsWebP.value)
        }
        webp.src =
            'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
}

// Generate WebP URL from JPG/JPEG URL
function getWebPUrl(url) {
    if (!url || typeof url !== 'string') return null
    if (!/\.(jpe?g)$/i.test(url)) return null
    return url.replace(/\.(jpe?g)$/i, '.webp')
}

// Check if a WebP version exists for a given URL
async function checkWebPVersion(url) {
    if (!url || typeof url !== 'string') return url

    // Only process .jpg and .jpeg URLs
    if (!/\.(jpe?g)$/i.test(url)) return url

    // Check cache first
    if (checkedUrls.has(url)) {
        return checkedUrls.get(url)
    }

    // Check if browser supports WebP
    const hasWebPSupport = await detectWebPSupport()
    if (!hasWebPSupport) {
        checkedUrls.set(url, url)
        return url
    }

    // Generate WebP URL
    const webpUrl = getWebPUrl(url)

    // Check if WebP version exists
    try {
        const response = await fetch(webpUrl, { method: 'HEAD' })
        if (response.ok) {
            checkedUrls.set(url, webpUrl)
            return webpUrl
        }
    } catch {
        // WebP version doesn't exist or network error
    }

    // Fall back to original
    checkedUrls.set(url, url)
    return url
}

export function useWebP() {
    return {
        checkWebPVersion,
        getWebPUrl,
        supportsWebP
    }
}
