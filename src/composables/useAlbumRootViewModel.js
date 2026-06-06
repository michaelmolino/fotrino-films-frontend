import { computed } from 'vue'
import { resolveMediaCanonicalPathForContext } from '@utils/channel-route.js'

export function useAlbumRootViewModel({ loading, channel, album, routeContext }) {
  const contentState = computed(() => {
    if (loading.value) return 'loading'
    const hasAlbumTarget = routeContext.value.hasAlbumTarget
    return channel.value && album.value && hasAlbumTarget ? 'ready' : 'not-found'
  })

  const allMedia = computed(() => {
    return album.value?.media || []
  })

  const featuredMedia = computed(() => {
    return allMedia.value.filter(m => m.main === true)
  })

  const featuredMediaCount = computed(() => {
    return featuredMedia.value.length
  })

  const otherMedia = computed(() => {
    return allMedia.value.filter(m => m.main !== true)
  })

  const displayState = computed(() => {
    if (featuredMediaCount.value === 0) {
      return allMedia.value.length === 0 ? 'empty' : 'all-list'
    }
    if (featuredMediaCount.value === 1) {
      return 'redirecting'
    }
    return 'split'
  })

  const allMediaCards = computed(() => {
    return allMedia.value
      .filter(media => !!media?.privateId)
      .map((media, index) => ({
        id: media.privateId,
        media,
        to: resolveMediaCanonicalPathForContext({
          context: routeContext.value,
          canonicalPath: media.canonicalPath
        }),
        priority: index === 0 ? 'high' : 'auto'
      }))
  })

  const featuredMediaCards = computed(() => {
    return featuredMedia.value
      .filter(media => !!media?.privateId)
      .map((media, index) => ({
        id: media.privateId,
        media,
        to: resolveMediaCanonicalPathForContext({
          context: routeContext.value,
          canonicalPath: media.canonicalPath
        }),
        priority: index === 0 ? 'high' : 'auto'
      }))
  })

  const otherMediaCards = computed(() => {
    return otherMedia.value
      .filter(media => !!media?.privateId)
      .map((media, index) => ({
        id: media.privateId,
        media,
        to: resolveMediaCanonicalPathForContext({
          context: routeContext.value,
          canonicalPath: media.canonicalPath
        }),
        priority: index === 0 ? 'high' : 'auto'
      }))
  })

  const showFeaturedSection = computed(() => featuredMediaCards.value.length > 0)
  const showOtherSection = computed(() => otherMediaCards.value.length > 0)

  return {
    contentState,
    allMedia,
    featuredMedia,
    featuredMediaCount,
    otherMedia,
    displayState,
    allMediaCards,
    featuredMediaCards,
    otherMediaCards,
    showFeaturedSection,
    showOtherSection
  }
}
