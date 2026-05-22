import { sanitizeText } from '@utils/text.js'

const getReadModelLookups = readModel => ({
  projectsByPublicId: readModel?.entities?.projectsByPublicId || {},
  mediaByPublicId: readModel?.entities?.mediaByPublicId || {},
})

// Helpers for each route type
function getChannelMeta(route, channel) {
  return {
    title: channel?.title || null,
    description: channel?.title || '',
    image: channel?.cover || null,
    type: 'website',
  }
}

function getProjectMeta(projectId, readModel) {
  const { projectsByPublicId } = getReadModelLookups(readModel)
  const project = projectsByPublicId[projectId] || null
  return {
    title: project?.title || null,
    description: sanitizeText(project?.subtitle || ''),
    image: project?.poster || null,
    type: 'website',
  }
}

function getMediaMeta(mediaId, readModel) {
  const { mediaByPublicId } = getReadModelLookups(readModel)
  const media = mediaByPublicId[mediaId] || null
  return {
    title: media?.title || null,
    description: sanitizeText(media?.descriptionUnsafe),
    image: media?.preview || null,
    type: 'video',
  }
}

function getPrivateMediaMeta(route, channel) {
  const media = channel?.project?.media || null
  return {
    title: media?.title || null,
    description: sanitizeText(media?.descriptionUnsafe),
    image: media?.preview || null,
    type: 'video',
  }
}

function getPrivateProjectMeta(channel) {
  const project = channel?.project || null
  return {
    title: project?.title || null,
    description: sanitizeText(project?.subtitle || ''),
    image: project?.poster || null,
    type: 'website',
  }
}

function getPrivateProjectMediaMeta(route, channel) {
  const media = (channel?.project?.media || []).find(item => item?.privateId === route?.params?.privateMediaId) || null
  return {
    title: media?.title || null,
    description: sanitizeText(media?.descriptionUnsafe),
    image: media?.preview || null,
    type: 'video',
  }
}

// Main meta generator
export function getMetaData(route, channel, readModel = null) {
  let meta = { title: null, description: '', image: null, type: 'website' }

  // Route type detection
  if (route?.params.channelId) {
    meta = getChannelMeta(route, channel)
  }
  if (route?.params.projectId) {
    meta = getProjectMeta(route.params.projectId, readModel)
  }
  if (route?.params.mediaId) {
    meta = getMediaMeta(route.params.mediaId, readModel)
  }
  if (route?.params.privateProjectId && !route?.params.privateMediaId) {
    meta = getPrivateProjectMeta(channel)
  }
  if (route?.params.privateProjectId && route?.params.privateMediaId) {
    meta = getPrivateProjectMediaMeta(route, channel)
  }
  if (route?.params.privateMediaId && !route?.params.privateProjectId) {
    meta = getPrivateMediaMeta(route, channel)
  }

  // Branding
  let title = meta.title
  let description = meta.description
  let image = meta.image
  let type = meta.type
  if (title) {
    title += ' | Fotrino Films'
  } else {
    title = 'Fotrino Films'
    description = title
  }

  // Open Graph URL
  const ogUrl = 'https://films.fotrino.com' + (route?.href?.split('?')[0] || '')

  // Compose meta tags
  return {
    title,
    meta: {
      description: { name: 'description', content: description },
      // Open Graph
      ogUrl: { property: 'og:url', content: ogUrl },
      ogTitle: { property: 'og:title', content: title },
      ogDescription: { property: 'og:description', content: description },
      ogImage: { property: 'og:image', content: image },
      ogImageAlt: { property: 'og:image:alt', content: title },
      ogType: { property: 'og:type', content: type },
      ogSiteName: { property: 'og:site_name', content: 'Fotrino Films' },

      // Twitter Cards
      twitterCard: {
        name: 'twitter:card',
        content: type === 'video' ? 'player' : 'summary_large_image'
      },
      twitterTitle: { name: 'twitter:title', content: title },
      twitterDescription: { name: 'twitter:description', content: description },
      twitterImage: { name: 'twitter:image', content: image },
      twitterImageAlt: { name: 'twitter:image:alt', content: title },
      ...(type === 'video' && {
        twitterPlayer: { name: 'twitter:player', content: ogUrl }
      })
    }
  }
}
