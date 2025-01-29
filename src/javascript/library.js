import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'; dayjs.extend(relativeTime)
import DOMPurify from 'dompurify'

export function getMetaData(route, collection) {
  let movie = null
  let chapter = null
  let title = null
  let description = ''
  let image = null
  let type = 'website'

  if (route?.params.uuid) {
    title = collection?.title
    description += title
    image = collection?.cover
  }

  if (route?.params.movieSlug) {
    movie = collection.movies.find(m => m.slug === route.params.movieSlug)
    if (route?.params.chapterSlug) {
      chapter = movie?.chapters?.find(ch => ch.slug === route.params.chapterSlug)
    } else {
      chapter = movie?.chapters.find(ch => ch.main)
    }
    title = chapter?.title
    description = sanitizeText(chapter?.description_unsafe)
    image = chapter?.preview
    type = 'video.other'
  }

  if (route?.params.privateId) {
    title = collection?.movie?.chapter?.title
    description = sanitizeText(collection?.movie?.chapter?.description_unsafe)
    image = collection?.movie?.chapter?.preview
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
