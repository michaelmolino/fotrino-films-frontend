const routes = [
  {
    path: '',
    component: () => import('@components/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@components/pages/Home.vue') },
      {
        path: 'profile',
        component: () => import('@components/account/Profile.vue')
      },
      { path: 'help', component: () => import('@components/pages/Help.vue') },
      {
        path: 'pricing',
        component: () => import('@components/pages/Pricing.vue')
      },
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
      '/:uuid([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/:collectionSlug([0-9a-zA-Z-]+)',
    component: () => import('@components/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@components/collection/Collection.vue')
      },
      {
        path: 'all',
        component: () => import('@components/collection/AllMedia.vue')
      },
      {
        path: ':movieSlug([0-9a-zA-Z-]+)/:chapterSlug([0-9a-zA-Z-]+)?',
        component: () => import('@components/collection/Movie.vue')
      }
    ]
  },
  {
    path: '/private',
    component: () => import('@components/MainLayout.vue'),
    children: [
      {
        path: ':privateId([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})',
        component: () => import('@components/collection/PrivateLink.vue')
      }
    ]
  },
  {
    path: '/dashboard',
    component: () => import('@components/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@components/account/CollectionDashboard.vue')
      },
      {
        path:
          ':uuid([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/:collectionSlug([0-9a-zA-Z-]+)',
        component: () => import('@components/account/MovieDashboard.vue')
      },
      {
        path:
          ':uuid([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/:collectionSlug([0-9a-zA-Z-]+)/:movieSlug([0-9a-zA-Z-]+)',
        component: () => import('@components/account/ChapterDashboard.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)',
    component: () => import('@components/errors/404.vue')
  }
]

export default routes
