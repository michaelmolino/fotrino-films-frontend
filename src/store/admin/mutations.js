export function SET_USERS(state, users) {
  if (Array.isArray(users)) {
    for (const user of users) {
      if (!user.avatar) {
        user.avatar = '/images/profile.png'
      }
    }
  }
  state.users = users
}

export function SET_OUTBOX_DLQ(state, payload) {
  state.outboxDLQ = Array.isArray(payload) ? payload : []
}

export function SET_REPORTED_MEDIA(state, payload) {
  state.reportedMedia = Array.isArray(payload) ? payload : []
}
