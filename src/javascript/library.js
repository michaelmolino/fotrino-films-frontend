import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'; dayjs.extend(relativeTime)
import DOMPurify from 'dompurify'

export function getMetaData(route, channel) {
  let project = null
  let media = null
  let title = null
  let description = ''
  let image = null
  let type = 'website'

  if (route?.params.uuid) {
    title = channel?.title
    description += title
    image = channel?.cover
  }

  if (route?.params.projectSlug) {
    project = channel.projects.find(m => m.slug === route.params.projectSlug)
    if (route?.params.mediaSlug) {
      media = project?.media?.find(ch => ch.slug === route.params.mediaSlug)
    } else {
      media = project?.media.find(ch => ch.main)
    }
    title = media?.title
    description = sanitizeText(media?.description_unsafe)
    image = media?.preview
    type = 'video.other'
  }

  if (route?.params.privateId) {
    title = channel?.project?.media?.title
    description = sanitizeText(channel?.project?.media?.description_unsafe)
    image = channel?.project?.media?.preview
    type = 'video.other'
  }

  if (title) {
    title += ' | Fotrino Films'
  } else {
    title = 'Fotrino Films'
    description = title
  }

  return {
    title: title,
    meta: {
      ogUrl: {
        property: 'og:url',
        content: 'https://films.fotrino.com' + route?.href.split('?')[0] || ''
      },
      ogTitle: {
        property: 'og:title',
        content: title
      },
      ogDescription: {
        property: 'og:description',
        content: description
      },
      ogImage: {
        property: 'og:image',
        content: image
      },
      ogType: {
        property: 'og:type',
        content: type
      }
    }
  }
}

export function daysSince(start) {
  return dayjs(start).fromNow()
}

export function sanitizeHtml(unsafe) {
  const ALLOWED_TAGS = ['br', 'i', 'p', 'strong']
  return DOMPurify.sanitize(unsafe, { ALLOWED_TAGS: ALLOWED_TAGS })
}

export function sanitizeText(unsafe) {
  const ALLOWED_TAGS = []
  const text = unsafe.replace(/<br[^>]*>/gi, '\n').replace(/<\/?p[^>]*>/gi, '\n')
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: ALLOWED_TAGS })
}
