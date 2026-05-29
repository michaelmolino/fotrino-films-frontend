import { watch } from 'vue'
import {
  buildAlbumPathForRouteContext,
  buildMediaPathForRouteContext
} from '@utils/channel-route.js'

export function useChannelRootRouteOrchestrator({ channel, loading, routeContext, route, redirect }) {
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

export function useAlbumRootRouteOrchestrator({
  channel,
  album,
  loading,
  routeContext,
  featuredMedia,
  featuredMediaCount,
  redirect
}) {
  watch(
    [album, channel, loading, routeContext],
    ([currentAlbum, currentChannel, isLoading, context]) => {
      if (!currentChannel || isLoading) return

      if (currentAlbum && context.albumSlug && currentAlbum.slug !== context.albumSlug) {
        const canonicalPath = buildAlbumPathForRouteContext({
          context,
          album: currentAlbum
        })
        if (canonicalPath) {
          redirect(canonicalPath)
        }
        return
      }

      if (!currentAlbum && context.hasAlbumTarget) {
        redirect('/404')
      }
    },
    { immediate: true }
  )

  watch(
    [featuredMediaCount, album, loading, channel, routeContext],
    ([count, currentAlbum, isLoading, currentChannel, context]) => {
      if (!currentChannel || !currentAlbum || isLoading || count !== 1 || !context.hasAlbumTarget) return

      const featured = featuredMedia.value[0]
      if (!featured) return

      const featuredPath = buildMediaPathForRouteContext({
        context,
        album: currentAlbum,
        media: featured
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
    ([currentAlbum, currentChannel, isLoading, context]) => {
      if (!currentChannel || isLoading) return
      if (!currentAlbum && context.hasMediaTarget) {
        redirect('/404')
      }
    },
    { immediate: true }
  )

  watch(
    [media, album, channel, loading],
    ([currentMedia, currentAlbum, currentChannel, isLoading]) => {
      if (!currentChannel || !currentAlbum || isLoading) return
      if ((currentAlbum.media?.length || 0) > 0 && !currentMedia) {
        redirect('/404')
      }
    },
    { immediate: true }
  )

  watch(
    [media, loading, routeContext, album],
    ([currentMedia, isLoading, context, currentAlbum]) => {
      if (!currentMedia || isLoading || !context.mediaSlug) return

      if (currentMedia.slug !== context.mediaSlug) {
        const canonicalPath = buildMediaPathForRouteContext({
          context,
          album: currentAlbum,
          media: currentMedia
        })
        if (canonicalPath) {
          redirect(canonicalPath)
        }
      }
    },
    { immediate: true }
  )
}