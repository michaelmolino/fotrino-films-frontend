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
      ogImage: { property: 'og:image', content: image }
    }
  }
}
