import { LocalStorage } from 'quasar'
import _ from 'underscore'
import { api } from 'boot/axios'

function updateHistory(context, channel) {
  const history = LocalStorage.getItem('fotrino-films-history') || []
  history.push({
    uuid: channel.uuid,
    title: channel.title,
    slug: channel.slug
  })
  const uniq = _.uniq(history, c => c.uuid)
  context.commit('SET_HISTORY', uniq)
  LocalStorage.set('fotrino-films-history', uniq)
}

export function getChannels(context, deep) {
  return api
    .get(!deep ? '/channels' : '/channels/deep')
    .then(response => {
      const channels = response.data
      context.commit('SET_CHANNELS', channels)
      return Promise.resolve(channels)
    })
    .catch(error => {
      context.commit('SET_CHANNELS', [])
      return Promise.reject(error)
    })
}

export function getChannel(context, params) {
  const uuid = params.uuid
  const pending = params.pending
  let url = '/channels/' + uuid
  if (pending) {
    url += '?pending=true'
  }
  return api
    .get(url)
    .then(response => {
      const channel = response.data
      channel.projects = channel.projects.sort((a, b) => { return a.sort - b.sort })
      channel.projects.forEach(m => { m.media = m.media.sort((a, b) => { return a.sort - b.sort }) })
      context.commit('SET_CHANNEL', channel)
      updateHistory(context, channel)
      return Promise.resolve(channel)
    })
    .catch(error => {
      context.commit('SET_CHANNEL', null)
      rmHistory(context, uuid)
      return Promise.reject(error)
    })
}

export function getPrivateMedia(context, privateId) {
  return api
    .get('/channels/media/private/' + privateId)
    .then(response => {
      const channel = response.data
      context.commit('SET_CHANNEL', channel)
      return Promise.resolve(channel)
    })
    .catch(error => {
      context.commit('SET_CHANNEL', null)
      return Promise.reject(error)
    })
}

export function postUpload(context, payload) {
  return api
    .post(
      '/channels/media', payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
    .then(response => {
      context.commit('SET_UPLOAD', response.data)
      return Promise.resolve(response.data)
    })
    .catch(error => {
      context.commit('SET_UPLOAD', null)
      return Promise.reject(error)
    })
}

export function confirmUpload(context, media) {
  return api
    .put('/channels/media/' + media)
    .catch(error => {
      return Promise.reject(error)
    })
}

export function getHistory(context) {
  const history = LocalStorage.getItem('fotrino-films-history') || []
  context.commit('SET_HISTORY', history)
  return Promise.resolve(history)
}

export function rmHistory(context, uuid) {
  const history = context.state.history.filter(u => u.uuid !== uuid)
  context.commit('SET_HISTORY', history)
  LocalStorage.set('fotrino-films-history', history)
}

export function deleteResource(context, resource) {
  const url = resource.type === 'channel'
    ? `/channels/${resource.id}`
    : `/channels/${resource.type}/${resource.id}`

  return api.delete(url).then(() => {
    const channels = context.state.channels.map(channel => {
      if (resource.type === 'channel' && channel.id === resource.id) {
        return null
      }
      const projects = channel.projects.map(project => {
        if (resource.type === 'project' && project.id === resource.id) {
          return null
        }
        const media = project.media.filter(media =>
          !(resource.type === 'media' && media.id === resource.id)
        )
        return { ...project, media }
      }).filter(Boolean)
      return { ...channel, projects }
    }).filter(Boolean)
    context.commit('SET_CHANNELS', channels)
  }).catch(error => {
    return Promise.reject(error)
  })
}
