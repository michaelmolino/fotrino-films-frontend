export function SET_USERS(state, users) {
  if (Array.isArray(users)) {
    users.forEach(user => {
      if (!user.profile_pic) {
        user.profile_pic = '/images/profile.png'
      }
    })
  }
  state.users = users
}
