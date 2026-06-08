import { watch } from 'vue'
import {
  resolveAlbumCanonicalPathForContext,
  resolveMediaCanonicalPathForContext
} from '@utils/channel-route.js'

export function useChannelRootRouteOrchestrator({
  channel,
  loading,
  routeContext,
  route,
  redirect
}) {
  watch(
    [channel, loading, routeContext],
    ([currentChannel, isLoading, context]) => {
      if (isLoading || !currentChannel || context?.type !== 'channel') return
      const preferredContentPath = currentChannel?.uiHints?.preferredContentPath
      if (!preferredContentPath || preferredContentPath === route.path) return
      redirect(preferredContentPath)
    },
    { immediate: true }
  )
}

export function useAlbumRootRouteOrchestrator({ channel, album, loading, routeContext, redirect }) {
  watch(
    [album, channel, loading, routeContext],
    ([currentAlbum, currentChannel, isLoading, context]) => {
      if (!currentChannel || isLoading) return

      if (currentAlbum && context.albumSlug && currentAlbum.slug !== context.albumSlug) {
        const canonicalPath = resolveAlbumCanonicalPathForContext({
          context,
          canonicalPath: currentAlbum.canonicalPath
        })
        if (canonicalPath) {
          redirect(canonicalPath)
        }
      }
    },
    { immediate: true }
  )

  watch(
    [album, loading, channel, routeContext],
    ([currentAlbum, isLoading, currentChannel, context]) => {
      if (!currentChannel || !currentAlbum || isLoading || !context.hasAlbumTarget) return
      if (!currentAlbum.uiHints?.preferredContentPath) return

      const featured = (currentAlbum.media || []).find(m => m.main === true)
      if (!featured) return

      const featuredPath = resolveMediaCanonicalPathForContext({
        context,
        canonicalPath: featured.canonicalPath
      })

      if (featuredPath) {
        redirect(featuredPath)
      }
    },
    { immediate: true }
  )
}

export function useMediaRootRouteOrchestrator({
  channel,
  album,
  media,
  loading,
  routeContext,
  redirect
}) {
  watch(
    [album, channel, loading, routeContext],
    ([, currentChannel, isLoading]) => {
      if (!currentChannel || isLoading) return
    },
    { immediate: true }
  )

  watch(
    [media, album, channel, loading],
    ([, , currentChannel, isLoading]) => {
      if (!currentChannel || isLoading) return
    },
    { immediate: true }
  )

  watch(
    [media, loading, routeContext, album],
    ([currentMedia, isLoading, context]) => {
      if (!currentMedia || isLoading || !context.mediaSlug) return

      if (currentMedia.slug !== context.mediaSlug) {
        const canonicalPath = resolveMediaCanonicalPathForContext({
          context,
          canonicalPath: currentMedia.canonicalPath
        })
        if (canonicalPath) {
          redirect(canonicalPath)
        }
      }
    },
    { immediate: true }
  )
}
