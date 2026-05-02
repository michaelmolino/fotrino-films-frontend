export function SET_CHANNELS(state, channels) {
  state.channels = channels
}

export function SET_CHANNEL(state, channel) {
  state.channel = channel ? { ...channel } : channel
}

export function SET_CHANNEL_LOAD_STATUS(state, status) {
  state.loadStatus = status
}

export function SET_UPLOAD(state, upload) {
  state.upload = upload
}

export function SET_MEDIA_TOKEN(state, token) {
  state.mediaToken = token
}
