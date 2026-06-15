import { formatTitleWithSubtitle, sanitizeText } from '@utils/text.js'
import { resolveImagePrimaryUrl } from '@utils/image-asset.js'

const SITE_BASE_URL = process.env.SITE_BASE_URL

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
function getChannelMeta(channel) {
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

function resolveRouteMeta(route, channel) {
  const params = route?.params
  if (!params) {
    return { title: null, description: '', image: null, type: 'website' }
  }

  if (params.privateMediaId) {
    return getPrivateMediaMeta(route, channel)
  }
  if (params.privateAlbumId) {
    return getPrivateAlbumMeta(channel)
  }
  if (params.mediaPublicId) {
    return getMediaMeta(channel, params.mediaPublicId)
  }
  if (params.albumPublicId) {
    return getAlbumMeta(channel, params.albumPublicId)
  }
  if (params.channelPublicId) {
    return getChannelMeta(channel)
  }

  return { title: null, description: '', image: null, type: 'website' }
}

function applyBranding(meta) {
  if (meta.title) {
    return {
      title: `${meta.title} | Fotrino Films`,
      description: meta.description,
      image: meta.image,
      type: meta.type
    }
  }

  return {
    title: 'Fotrino Films',
    description: 'Fotrino Films',
    image: meta.image,
    type: meta.type
  }
}

function buildMetaData({ title, description, image, type, ogUrl }) {
  const preloadPosterLink =
    type === 'video' && typeof image === 'string' && image.length > 0
      ? {
          rel: 'preload',
          as: 'image',
          href: image,
          fetchpriority: 'high'
        }
      : null

  const metaData = {
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

  if (preloadPosterLink) {
    metaData.link = {
      preloadPoster: preloadPosterLink
    }
  }

  return metaData
}

// Main meta generator
export function getMetaData(route, channel) {
  const resolvedMeta = resolveRouteMeta(route, channel)
  const { title, description, image, type } = applyBranding(resolvedMeta)

  // Open Graph URL
  const routePath = route ? route.fullPath.split('?')[0] : '/'
  const ogUrl = `${SITE_BASE_URL}${routePath}`

  return buildMetaData({ title, description, image, type, ogUrl })
}
