export function SET_CHANNELS(state, channels) {
  state.channels = channels
}

export function SET_CHANNEL(state, channel) {
  state.channel = channel ? { ...channel } : channel
}

export function SET_UPLOAD(state, upload) {
  state.upload = upload
}
