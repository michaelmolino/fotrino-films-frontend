import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'

export default function createRouterInstance() {
  let createHistory
  if (import.meta.env.QUASAR_SERVER) {
    createHistory = createMemoryHistory
  } else if (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history') {
    createHistory = createWebHistory
  } else {
    createHistory = createWebHashHistory
  }

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      import.meta.env.QUASAR_MODE === 'ssr' ? void 0 : import.meta.env.QUASAR_VUE_ROUTER_BASE
    )
  })

  return Router
}
