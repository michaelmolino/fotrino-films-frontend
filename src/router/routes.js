const routes = [
  {
    path: '',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@components/pages/Home.vue') },
      { path: 'help', component: () => import('@components/pages/Help.vue') },
      {
        path: 'terms',
        component: () => import('@components/pages/Terms.vue')
      },
      { path: '404', component: () => import('@components/errors/404.vue') },
      { path: '409', component: () => import('@components/errors/409.vue') }
    ]
  },
  {
    path:
      '/:uuid([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/:channelSlug([0-9a-zA-Z-]+)',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@components/channel/ChannelRoot.vue')
      },
      {
        path: ':projectSlug([0-9a-zA-Z-]+)/:mediaSlug([0-9a-zA-Z-]+)?',
        component: () => import('@components/channel/ProjectRoot.vue')
      }
    ]
  },
  {
    path: '/private',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      {
        path: ':privateId([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})',
        component: () => import('@components/channel/ProjectRoot.vue')
      }
    ]
  },
  {
    path: '/account',
    component: () => import('@layouts/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@components/account/ChannelDashboard.vue')
      },
      {
        path: 'upload',
        component: () => import('@components/account/UploadMedia.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)',
    component: () => import('@components/errors/404.vue')
  }
]

export default routes
