export default function createChannelState() {
  return {
    channels: [],
    channel: null,
    loadStatus: 'idle',
    upload: null,
    mediaToken: null
  }
}
