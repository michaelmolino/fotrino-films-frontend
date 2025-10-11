export function SET_PROFILE(state, profile) {
  if (profile && !profile.profile_pic) {
    profile.profile_pic = '/images/profile.png'
  }
  state.profile = profile
}

export function SET_PROVIDERS(state, providers) {
  state.providers = providers
}

export function SET_COMMENTBOX(state, commentbox) {
  state.commentbox = commentbox
}
