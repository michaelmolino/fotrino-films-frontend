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
    title = movie?.title
    description += ' | ' + title
    image = movie?.poster
  }

  if (route?.params.chapterSlug) {
    chapter = movie?.chapters?.find(ch => ch.slug === route.params.chapterSlug)
    title = chapter?.title
    description = chapter?.description_text
    image = chapter?.preview
    type = 'video.other'
  }

  if (title !== null) {
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
