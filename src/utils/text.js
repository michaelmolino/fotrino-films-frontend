import DOMPurify from 'dompurify'

// Only allow a minimal set of tags for safe HTML rendering
const ALLOWED_TAGS = ['br', 'i', 'p', 'strong']

export function sanitizeHtml(unsafe) {
  return DOMPurify.sanitize(unsafe, { ALLOWED_TAGS })
}

// Remove all HTML tags except line breaks, convert <br> and <p> to newlines, then sanitize
export function sanitizeText(unsafe) {
  if (!unsafe) return ''
  const cleaned = unsafe.replaceAll(/<br[^>]*>/gi, '\n').replaceAll(/<\/?p[^>]*>/gi, '\n')
  return DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [] })
}
