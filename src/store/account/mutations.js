export function SET_PROFILE(state, profile) {
  if (profile && !profile.avatar) {
    profile.avatar = '/images/profile.png'
  }
  state.profile = profile
}

export function SET_PROVIDERS(state, providers) {
  state.providers = providers
}
