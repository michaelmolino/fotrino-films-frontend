import { formatTitleWithSubtitle, sanitizeText } from '@utils/text.js'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

function findAlbum(channel, albumPublicId) {
  if (!channel || !albumPublicId) {
    return null
  }
  return channel.albums.find(item => item.publicId === albumPublicId)
}

function findMedia(channel, mediaPublicId) {
  if (!channel || !mediaPublicId) {
    return null
  }
  for (const album of channel.albums) {
    const found = album.media.find(item => item.publicId === mediaPublicId)
    if (found) {
      return found
    }
  }
  return null
}

// Helpers for each route type
function getChannelMeta(route, channel) {
  return {
    title: channel.title,
    description: channel.title,
    image: resolveImagePrimaryUrl(channel.coverAsset),
    type: 'website'
  }
}

function getAlbumMeta(channel, albumPublicId) {
  const album = findAlbum(channel, albumPublicId)
  return {
    title: formatTitleWithSubtitle(album.title, album.subtitle),
    description: sanitizeText(album.subtitle),
    image: resolveImagePrimaryUrl(album.posterAsset),
    type: 'website'
  }
}

function getMediaMeta(channel, mediaPublicId) {
  const media = findMedia(channel, mediaPublicId)
  return {
    title: media.title,
    description: sanitizeText(media?.descriptionUnsafe),
    image: resolveImagePrimaryUrl(media.previewAsset),
    type: 'video'
  }
}

function getPrivateMediaMeta(route, channel) {
  const media = channel.album.media.find(item => item.privateId === route.params.privateMediaId)
  return {
    title: media.title,
    description: sanitizeText(media.descriptionUnsafe),
    image: resolveImagePrimaryUrl(media.previewAsset),
    type: 'video'
  }
}

function getPrivateAlbumMeta(channel) {
  const album = channel.album
  return {
    title: formatTitleWithSubtitle(album.title, album.subtitle),
    description: sanitizeText(album.subtitle),
    image: resolveImagePrimaryUrl(album.posterAsset),
    type: 'website'
  }
}

// Main meta generator
export function getMetaData(route, channel) {
  let meta = { title: null, description: '', image: null, type: 'website' }

  // Route type detection
  if (route?.params.channelPublicId) {
    meta = getChannelMeta(route, channel)
  }
  if (route?.params.albumPublicId) {
    meta = getAlbumMeta(channel, route.params.albumPublicId)
  }
  if (route?.params.mediaPublicId) {
    meta = getMediaMeta(channel, route.params.mediaPublicId)
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
  const ogUrl = `https://films.fotrino.com${route.href.split('?')[0]}`
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
