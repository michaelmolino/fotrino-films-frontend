const mainLayout = () => import('@layouts/MainLayout.vue')

const withMainLayout = (path, children) => ({
  path,
  component: mainLayout,
  children
})

const withMainLayoutRoot = (path, component) =>
  withMainLayout(path, [{ path: '', component }])

const routes = [
  withMainLayout('', [
    { path: '', component: () => import('@components/pages/Home.vue') },
    { path: 'help', component: () => import('@components/pages/Help.vue') },
    { path: 'terms', component: () => import('@components/pages/Terms.vue') },
    { path: '404', component: () => import('@components/errors/404.vue') },
    { path: 'account-deleted', component: () => import('@components/errors/AccountDeleted.vue') }
  ]),
  withMainLayoutRoot(
    '/c/:channelId([0-9A-Za-z_-]+)/:channelSlug([0-9a-zA-Z-]+)',
    () => import('@components/channel/ChannelRoot.vue')
  ),
  withMainLayoutRoot(
    '/a/:albumId([0-9A-Za-z_-]+)/:albumSlug([0-9a-zA-Z-]+)',
    () => import('@components/channel/AlbumRoot.vue')
  ),
  withMainLayoutRoot(
    '/m/:mediaId([0-9A-Za-z_-]+)/:mediaSlug([0-9a-zA-Z-]+)',
    () => import('@components/channel/MediaRoot.vue')
  ),
  withMainLayoutRoot(
    '/private/a/:privateAlbumId([0-9A-Za-z_-]+)/:albumSlug([0-9a-zA-Z-]+)',
    () => import('@components/channel/AlbumRoot.vue')
  ),
  withMainLayoutRoot(
    '/private/a/:privateAlbumId([0-9A-Za-z_-]+)/m/:privateMediaId([0-9A-Za-z_-]+)/:mediaSlug([0-9a-zA-Z-]+)',
    () => import('@components/channel/MediaRoot.vue')
  ),
  withMainLayoutRoot(
    '/private/m/:privateMediaId([0-9A-Za-z_-]+)/:mediaSlug([0-9a-zA-Z-]+)',
    () => import('@components/channel/MediaRoot.vue')
  ),
  withMainLayout('/account', [
    { path: 'dashboard', component: () => import('@components/account/ChannelDashboard.vue') },
    { path: 'upload', component: () => import('@components/account/UploadMediaComposer.vue') }
  ]),
  withMainLayoutRoot('/admin', () => import('@components/admin/AdminDashboard.vue')),
  {
    path: '/:catchAll(.*)',
    component: () => import('@components/errors/404.vue')
  }
]

export default routes
