const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Home.vue') }]
  },
  {
    path: '/:userUuid',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/MovieIndex.vue') },
      {
        path: 'movies/:movieId',
        component: () => import('pages/ChapterIndex.vue')
      },
      {
        path: 'audio/:audioId',
        component: () => import('pages/AudioIndex.vue')
      },
      {
        path: 'movies/:movieId/:chapterId',
        component: () => import('pages/Chapter.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
