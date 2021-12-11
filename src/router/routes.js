const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/MovieIndex.vue') },
      {
        path: 'movies/:movieId/:chapterId?',
        component: () => import('pages/ChapterIndex.vue')
      },
      {
        path: 'audio/:audioId',
        component: () => import('pages/AudioIndex.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
