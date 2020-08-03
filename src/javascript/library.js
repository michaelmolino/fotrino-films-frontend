export function getMetaData (route, collection) {
  let movie = null
  let chapter = null
  let title = null
  let image = null

  title = collection?.title
  image = collection?.coverUrl

  if (route?.params.movieSlug) {
    movie = collection.movies.find(
      m => m.slug === route.params.movieSlug
    )
    title = movie?.title
    image = movie?.coverUrl
  }

  if (route?.params.chapterSlug) {
    chapter = movie?.chapters?.find(
      ch => ch.slug === route.params.chapterSlug
    )
    title = chapter?.title
    image = chapter?.previewUrl
  }

  if (title !== null) {
    title += ' | Fotrino Films'
  } else {
    title = 'Fotrino Films'
  }

  return {
    title: title,
    meta: {
      ogTitle: {
        property: 'og:title',
        content: title
      },
      ogImage: { property: 'og:image', content: image }
    }
  }
}
