const routes = [
  {
    path: '',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@components/pages/Home.vue') },
      { path: 'help', component: () => import('@components/pages/Help.vue') },
      { path: 'terms', component: () => import('@components/pages/Terms.vue') },
      { path: '404', component: () => import('@components/errors/404.vue') },
      { path: 'account-deleted', component: () => import('@components/errors/AccountDeleted.vue') }
    ]
  },
  {
    path: '/c/:channelId([0-9A-Za-z_-]+)/:channelSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/channel/ChannelRoot.vue') }]
  },
  {
    path: '/a/:albumId([0-9A-Za-z_-]+)/:albumSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/channel/AlbumRoot.vue') }]
  },
  {
    path: '/m/:mediaId([0-9A-Za-z_-]+)/:mediaSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/channel/MediaRoot.vue') }]
  },
  {
    path: '/private/a/:privateAlbumId([0-9A-Za-z_-]+)/:albumSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/channel/AlbumRoot.vue') }]
  },
  {
    path: '/private/a/:privateAlbumId([0-9A-Za-z_-]+)/m/:privateMediaId([0-9A-Za-z_-]+)/:mediaSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/channel/MediaRoot.vue') }]
  },
  {
    path: '/private/m/:privateMediaId([0-9A-Za-z_-]+)/:mediaSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/channel/MediaRoot.vue') }]
  },
  {
    path: '/account',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@components/account/ChannelDashboard.vue') },
      { path: 'upload', component: () => import('@components/account/UploadMediaRouteEntry.vue') }
    ]
  },
  {
    path: '/admin',
    component: () => import('@layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('@components/admin/AdminDashboard.vue') }]
  },
  {
    path: '/:catchAll(.*)',
    component: () => import('@components/errors/404.vue')
  }
]

export default routes
