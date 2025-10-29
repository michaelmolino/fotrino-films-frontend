/*
 * Quasar Vite config
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@quasar/app-vite/wrappers'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(() => ({
  supportTS: false,
  boot: ['install-store', 'resize-observer-patch', 'passive-events', 'axios'],
  css: ['app.sass'],
  extras: ['fontawesome-v6', 'material-icons'],

  build: {
    vueRouterMode: 'history',
    publicPath: '/',
    env: {
      API: process.env.NODE_ENV === 'production' ? 'https://films.fotrino.com/api' : '/api'
    },
    sourcemap: true,
    extendViteConf(viteConf) {
      viteConf.resolve = viteConf.resolve || {}
      viteConf.resolve.alias = {
        ...(viteConf.resolve.alias || {}),
        '@layouts': path.resolve(__dirname, 'src/layouts'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@composables': path.resolve(__dirname, 'src/composables'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@libs': path.resolve(__dirname, 'src/libs'),
        '@deps': path.resolve(__dirname, 'node_modules')
      }
      console.debug('Final aliases in use:', viteConf.resolve.alias)
    }
  },

  devServer: {
    https: true,
    host: 'fotrino.example.com',
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'https://fotrino.example.com:65443/',
        changeOrigin: false,
        secure: false
      }
    }
  },

  framework: {
    iconSet: 'material-icons',
    lang: 'en-US',
    config: { dark: 'auto' },
    importStrategy: 'auto',
    plugins: ['Dialog', 'Loading', 'LocalStorage', 'Meta', 'Notify']
  },

  animations: ['zoomInDown'],

  ssr: { pwa: false }
}))
