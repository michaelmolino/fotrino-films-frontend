import { boot } from 'quasar/wrappers'

const nullProfile = {
  id: null,
  identity_provider: null,
  external_id: null,
  name: null,
  email: null,
  profile_pic: null,
  country: null,
  csrf_token: null
}

const nullCollection = {
  id: null,
  owner: null,
  title: null,
  slug: null,
  cover: null,
  uuid: null,
  movies: []
}

const nullMovie = {
  id: null,
  collection: null,
  sort: null,
  title: null,
  slug: null,
  subtitle: null,
  poster: null,
  chapters: []
}

const nullChapter = {
  id: null,
  movie: null,
  sort: null,
  title: null,
  slug: null,
  description_unsafe: null,
  description_sanitised: null,
  description_text: null,
  preview: null,
  src: null,
  type: null,
  main: null
}

export default boot(({ app }) => {
  app.config.globalProperties.$nullProfile = nullProfile
  app.config.globalProperties.$nullCollection = nullCollection
  app.config.globalProperties.$nullMovie = nullMovie
  app.config.globalProperties.$nullChapter = nullChapter
})

export { nullProfile, nullCollection, nullMovie, nullChapter }
