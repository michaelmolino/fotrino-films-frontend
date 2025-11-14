/*
 * Quasar Vite config
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@quasar/app-vite/wrappers'
import viteCompression from 'vite-plugin-compression'
import istanbul from 'vite-plugin-istanbul'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(() => ({
  supportTS: false,
  boot: ['install-store', 'resize-observer-patch', 'passive-events', 'axios'],
  css: [],
  extras: ['material-icons'],

  build: {
    vueRouterMode: 'history',
    publicPath: '/',
    env: {
      API: process.env.NODE_ENV === 'production' ? 'https://films.fotrino.com/api' : '/api'
    },
    sourcemap: process.env.NODE_ENV !== 'production',
    extendViteConf(viteConf) {
      viteConf.resolve = viteConf.resolve || {}
      viteConf.resolve.alias = viteConf.resolve.alias || {}
      viteConf.resolve.alias = {
        ...viteConf.resolve.alias,
        '@layouts': path.resolve(__dirname, 'src/layouts'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@composables': path.resolve(__dirname, 'src/composables'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@libs': path.resolve(__dirname, 'src/libs'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@deps': path.resolve(__dirname, 'node_modules')
      }
      viteConf.resolve.alias['commentbox.io'] = path.resolve(
        __dirname,
        'node_modules/commentbox.io/dist/commentbox.min.js'
      )
      viteConf.optimizeDeps = viteConf.optimizeDeps || {}
      viteConf.optimizeDeps.include = [...(viteConf.optimizeDeps.include || []), 'commentbox.io']
      viteConf.plugins = viteConf.plugins || []
      viteConf.plugins.push(
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
        viteCompression({ algorithm: 'gzip', ext: '.gz' })
      )
      if (process.env.COVERAGE === 'true') {
        viteConf.plugins.push(
          istanbul({
            include: ['src/**/*.js', 'src/**/*.vue'],
            extension: ['.js', '.vue'],
            cypress: true,
            requireEnv: false
          })
        )
      }
    }
  },

  devServer: {
    https: true,
    host: 'fotrino.example.com',
    port: 8080,
    open: process.env.COVERAGE !== 'true',
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
