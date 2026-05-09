import { sanitizeText } from '@utils/text.js'

// Helpers for each route type
function getChannelMeta(route, channel) {
  return {
    title: channel?.title || null,
    description: channel?.title || '',
    image: channel?.cover || null,
    type: 'website',
  }
}

function getProjectMeta(route, channel) {
  const project = channel?.projects?.find(p => p.slug === route.params.projectSlug)
  if (route?.params.mediaSlug) {
    // Media metadata
    const media = project?.media?.find(m => m.slug === route.params.mediaSlug)
    return {
      title: media?.title || null,
      description: sanitizeText(media?.descriptionUnsafe),
      image: media?.preview || null,
      type: 'video',
    }
  } else {
    // Project metadata
    return {
      title: project?.title || null,
      description: sanitizeText(project?.subtitle || ''),
      image: project?.poster || null,
      type: 'website',
    }
  }
}

function getPrivateMediaMeta(route, channel) {
  const media = channel?.project?.media
  return {
    title: media?.title || null,
    description: sanitizeText(media?.descriptionUnsafe),
    image: media?.preview || null,
    type: 'video',
  }
}

// Main meta generator
export function getMetaData(route, channel) {
  let meta = { title: null, description: '', image: null, type: 'website' }

  // Route type detection
  if (route?.params.uuid) {
    meta = getChannelMeta(route, channel)
  }
  if (route?.params.projectSlug) {
    meta = getProjectMeta(route, channel)
  }
  if (route?.params.privateId) {
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
