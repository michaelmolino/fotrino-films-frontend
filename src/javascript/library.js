export function setMetaData (title, image) {
  if (title !== null) {
    title += ' | fotrino-films'
  } else {
    title = 'fotrino-films'
  }

  return {
    title: title,
    meta: {
      ogTitle: {
        property: 'og:title',
        content: title
      },
      ogImage: { name: 'og:image', content: image }
    }
  }
}

export function setBreadcrumb (userUuid, collection, movie, chapter) {
  const breadcrumbs = []

  breadcrumbs.push({
    id: 0,
    label: collection.title,
    to: '/' + userUuid
  })

  if (movie !== null) {
    console.log(movie)
    breadcrumbs.push({
      id: 1,
      label: movie.title,
      to: '/' + userUuid + '/' + movie.mediaType + '/' + movie.id
    })
  }

  if (movie !== null && chapter !== null) {
    breadcrumbs.push({
      id: 2,
      label: chapter.title,
      to:
        '/' +
        userUuid +
        '/' +
        movie.mediaType +
        '/' +
        movie.id +
        '/' +
        chapter.id
    })
  }

  return breadcrumbs
}
