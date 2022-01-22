const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Home.vue') },
      { path: '/about', component: () => import('pages/About.vue') },
      { path: '/dashboard', component: () => import('pages/account/Dashboard.vue') },
      { path: 'terms', component: () => import('pages/legal/Terms.vue') },
      { path: '/403', component: () => import('pages/errors/403.vue') },
      { path: '/409', component: () => import('pages/errors/409.vue') }
    ]
  },
  {
    path: '/:userUuid',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/collection/MovieIndex.vue') },
      {
        path: 'movies/:movieId',
        component: () => import('pages/collection/ChapterIndex.vue')
      },
      {
        path: 'movies/:movieId/:chapterId',
        component: () => import('pages/collection/Chapter.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)',
    component: () => import('pages/errors/404.vue')
  }
]

export default routes
