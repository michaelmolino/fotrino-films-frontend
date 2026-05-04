import { ref } from 'vue'

const supportsWebP = ref(null)

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

// Build an explicit image source strategy that components can apply directly:
// load primaryUrl first, then fallbackUrl on error when provided.
async function resolvePreviewSource(url) {
  if (!url || typeof url !== 'string') {
    return {
      strategy: 'original-only',
      primaryUrl: null,
      fallbackUrl: null
    }
  }

  const webpUrl = getWebPUrl(url)
  if (!webpUrl) {
    return {
      strategy: 'original-only',
      primaryUrl: url,
      fallbackUrl: null
    }
  }

  const hasWebPSupport = await detectWebPSupport()
  if (!hasWebPSupport) {
    return {
      strategy: 'original-only',
      primaryUrl: url,
      fallbackUrl: null
    }
  }

  return {
    strategy: 'webp-primary-jpeg-fallback',
    primaryUrl: webpUrl,
    fallbackUrl: url
  }
}

// Backward-compatible helper for existing call sites.
async function checkWebPVersion(url) {
  const source = await resolvePreviewSource(url)
  return source.primaryUrl || url
}

export function useWebP() {
  return {
    checkWebPVersion,
    resolvePreviewSource,
    getWebPUrl,
    supportsWebP
  }
}
