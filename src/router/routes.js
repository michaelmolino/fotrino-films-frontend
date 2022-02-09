const routes = [
  {
    path: '/',
    component: () => import('@components/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@components/pages/Home.vue') },
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
    path: '/:uuid/:collectionSlug',
    component: () => import('@components/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@components/collection/Collection.vue')
      },
      {
        path: ':movieSlug',
        component: () => import('@components/collection/Movie.vue')
      },
      {
        path: ':movieSlug/:chapterSlug',
        component: () => import('@components/collection/Chapter.vue')
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
        path: 'movies',
        query: { name: 'uuid' },
        component: () => import('@components/account/MovieDashboard.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)',
    component: () => import('@components/errors/404.vue')
  }
]

export default routes
