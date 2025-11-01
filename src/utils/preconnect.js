// Utilities to add preconnect/dns-prefetch hints at runtime
// Safe to call multiple times; no-ops if tags already exist

function addLinkOnce(rel, href, attrs = {}) {
    try {
        const selector = `link[rel="${rel}"][href="${href}"]`
        if (document.querySelector(selector)) return
        const link = document.createElement('link')
        link.rel = rel
        link.href = href
        for (const [k, v] of Object.entries(attrs)) {
            if (v !== undefined && v !== null && v !== false) link.setAttribute(k, String(v))
        }
        document.head?.appendChild(link)
    } catch {
        // ignore
    }
}

export function addPreconnectForUrl(urlLike) {
    try {
        if (!urlLike) return
        const base = globalThis.location?.origin || ''
        const u = new URL(String(urlLike), base)
        const origin = u.origin
        if (!origin || origin === base) return

        // Preconnect and DNS prefetch for cross-origin
        addLinkOnce('preconnect', origin, { crossorigin: 'anonymous' })
        addLinkOnce('dns-prefetch', `//${u.host}`)
    } catch {
        // ignore
    }
}

export function addPreconnectForOrigin(origin) {
    try {
        if (!origin) return
        const base = globalThis.location?.origin || ''
        const u = new URL(String(origin), base)
        const o = u.origin
        if (!o || o === base) return
        addLinkOnce('preconnect', o, { crossorigin: 'anonymous' })
        addLinkOnce('dns-prefetch', `//${u.host}`)
    } catch {
        // ignore
    }
}

// Preload an image once (optionally with high fetch priority)
export function addPreloadImageOnce(src, priority = 'high') {
    try {
        if (!src) return
        const href = String(src)
        const selector = `link[rel="preload"][as="image"][href="${href}"]`
        if (document.querySelector(selector)) return
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = href
        if (priority) link.setAttribute('fetchpriority', priority)
        document.head?.appendChild(link)
    } catch {
        // ignore
    }
}
