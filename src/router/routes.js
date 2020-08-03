const routes = [
  {
    path: '/',
    component: () => import('@components/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@components/Home.vue') },
      { path: '/help', component: () => import('@components/Help.vue') },
      { path: '/dashboard', component: () => import('@components/account/CollectionDashboard.vue') },
      { path: '/dashboard/movies', query: { name: 'uuid' }, component: () => import('@components/account/MovieDashboard.vue') },
      { path: '/pricing', component: () => import('@components/account/Pricing.vue') },
      { path: 'terms', component: () => import('@components/legal/Terms.vue') },
      { path: '/404', component: () => import('@components/errors/404.vue') },
      { path: '/409', component: () => import('@components/errors/409.vue') }
    ]
  },
  {
    path: '/:uuid/:collectionSlug',
    component: () => import('@components/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@components/collection/Collection.vue') },
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
    path: '/:catchAll(.*)',
    component: () => import('@components/errors/404.vue')
  }
]

export default routes
