import DOMPurify from 'dompurify'

export function sanitizeHtml(unsafe) {
  const ALLOWED_TAGS = ['br', 'i', 'p', 'strong']
  return DOMPurify.sanitize(unsafe, { ALLOWED_TAGS })
}

export function sanitizeText(unsafe) {
  if (!unsafe) return ''
  const cleaned = unsafe.replace(/<br[^>]*>/gi, '\n').replace(/<\/?p[^>]*>/gi, '\n')
  return DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [] })
}
