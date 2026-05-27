import { sanitizeText } from '@utils/text.js'

const getReadModelLookups = readModel => ({
  albumsByPublicId: readModel?.entities?.albumsByPublicId || {},
  mediaByPublicId: readModel?.entities?.mediaByPublicId || {}
})

// Helpers for each route type
function getChannelMeta(route, channel) {
  return {
    title: channel?.title || null,
    description: channel?.title || '',
    image: channel?.cover || null,
    type: 'website'
  }
}

function getAlbumMeta(albumPublicId, readModel) {
  const { albumsByPublicId } = getReadModelLookups(readModel)
  const album = albumsByPublicId[albumPublicId] || null
  return {
    title: album?.title || null,
    description: sanitizeText(album?.subtitle || ''),
    image: album?.poster || null,
    type: 'website'
  }
}

function getMediaMeta(mediaPublicId, readModel) {
  const { mediaByPublicId } = getReadModelLookups(readModel)
  const media = mediaByPublicId[mediaPublicId] || null
  return {
    title: media?.title || null,
    description: sanitizeText(media?.descriptionUnsafe),
    image: media?.preview || null,
    type: 'video'
  }
}

function getPrivateMediaMeta(route, channel) {
  const media =
    (channel?.album?.media || []).find(item => item?.privateId === route?.params?.privateMediaId) ||
    null
  return {
    title: media?.title || null,
    description: sanitizeText(media?.descriptionUnsafe),
    image: media?.preview || null,
    type: 'video'
  }
}

function getPrivateAlbumMeta(channel) {
  const album = channel?.album || null
  return {
    title: album?.title || null,
    description: sanitizeText(album?.subtitle || ''),
    image: album?.poster || null,
    type: 'website'
  }
}

// Main meta generator
export function getMetaData(route, channel, readModel = null) {
  let meta = { title: null, description: '', image: null, type: 'website' }

  // Route type detection
  if (route?.params.channelPublicId) {
    meta = getChannelMeta(route, channel)
  }
  if (route?.params.albumPublicId) {
    meta = getAlbumMeta(route.params.albumPublicId, readModel)
  }
  if (route?.params.mediaPublicId) {
    meta = getMediaMeta(route.params.mediaPublicId, readModel)
  }
  if (route?.params.privateAlbumId && !route?.params.privateMediaId) {
    meta = getPrivateAlbumMeta(channel)
  }
  if (route?.params.privateAlbumId && route?.params.privateMediaId) {
    meta = getPrivateMediaMeta(route, channel)
  }
  if (route?.params.privateMediaId && !route?.params.privateAlbumId) {
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
  const link =
    type === 'video' && image
      ? {
        preloadPoster: {
          rel: 'preload',
          as: 'image',
          href: image,
          fetchpriority: 'high'
        }
      }
      : {}

  // Compose meta tags
  return {
    title,
    link,
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
