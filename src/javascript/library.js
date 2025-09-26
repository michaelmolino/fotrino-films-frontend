import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'

dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isYesterday)

import DOMPurify from 'dompurify'

export function sanitizeHtml(unsafe) {
  const ALLOWED_TAGS = ['br', 'i', 'p', 'strong']
  return DOMPurify.sanitize(unsafe, { ALLOWED_TAGS })
}

export function sanitizeText(unsafe) {
  if (!unsafe) return ''
  const cleaned = unsafe
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
  return DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [] })
}

export function daysSince(start, withTime = true) {
  const day = dayjs(start)
  if (!withTime) {
    if (day.isToday()) return 'today'
    if (day.isYesterday()) return 'yesterday'
  }
  return day.fromNow()
}

export function getMetaData(route, channel) {
  let title = null
  let description = ''
  let image = null
  let type = 'website'

  // Case: Channel
  if (route?.params.uuid) {
    title = channel?.title || null
    description = title || ''
    image = channel?.cover || null
  }

  // Case: Project + optional media
  if (route?.params.projectSlug) {
    const project = channel?.projects?.find(
      p => p.slug === route.params.projectSlug
    )
    const media =
      route?.params.mediaSlug
        ? project?.media?.find(m => m.slug === route.params.mediaSlug)
        : project?.media?.find(m => m.main)

    title = media?.title || null
    description = sanitizeText(media?.description_unsafe)
    image = media?.preview || null
    type = 'video.other'
  }

  // Case: Private media
  if (route?.params.privateId) {
    const media = channel?.project?.media
    title = media?.title || null
    description = sanitizeText(media?.description_unsafe)
    image = media?.preview || null
    type = 'video.other'
  }

  // Branding
  if (title) {
    title += ' | Fotrino Films'
  } else {
    title = 'Fotrino Films'
    description = title
  }

  const ogUrl =
    'https://films.fotrino.com' + (route?.href?.split('?')[0] || '')

  return {
    title,
    meta: {
      ogUrl: { property: 'og:url', content: ogUrl },
      ogTitle: { property: 'og:title', content: title },
      ogDescription: { property: 'og:description', content: description },
      ogImage: { property: 'og:image', content: image },
      ogType: { property: 'og:type', content: type }
    }
  }
}
