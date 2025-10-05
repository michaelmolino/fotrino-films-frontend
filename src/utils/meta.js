import { sanitizeText } from '@utils/text.js'

export function getMetaData(route, channel) {
  let title = null
  let description = ''
  let image = null
  let type = 'website'

  // Case: Channel
  if (route?.params.uuid) {
    title = channel?.title || null
    description = title || ''
    image = channel?.cover || null
  }

  // Case: Project + optional media
  if (route?.params.projectSlug) {
    const project = channel?.projects?.find(p => p.slug === route.params.projectSlug)
    const media = route?.params.mediaSlug
      ? project?.media?.find(m => m.slug === route.params.mediaSlug)
      : project?.media?.find(m => m.main)

    title = media?.title || null
    description = sanitizeText(media?.description_unsafe)
    image = media?.preview || null
    type = 'video'
  }

  // Case: Private media
  if (route?.params.privateId) {
    const media = channel?.project?.media
    title = media?.title || null
    description = sanitizeText(media?.description_unsafe)
    image = media?.preview || null
    type = 'video'
  }

  // Branding
  if (title) {
    title += ' | Fotrino Films'
  } else {
    title = 'Fotrino Films'
    description = title
  }

  const ogUrl = 'https://films.fotrino.com' + (route?.href?.split('?')[0] || '')

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
      twitterCard: { name: 'twitter:card', content: type === 'video' ? 'player' : 'summary_large_image' },
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
