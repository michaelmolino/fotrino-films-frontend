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

// export function collectionToTree (collection) {
//   const data = JSON.parse(JSON.stringify(collection))
//
//   data.icon = 'video_library'
//   data.children = data.movies
//   data.children.forEach(function (movie) {
//     movie.icon = 'movie'
//     movie.children = movie.chapters
//     movie.children.forEach(function (chapter) {
//       chapter.icon = 'play_circle_filled'
//     })
//   })
//
//   console.log(data)
//   return [data]
// }
