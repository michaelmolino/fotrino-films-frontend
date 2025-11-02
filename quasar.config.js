/*
 * Quasar Vite config
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@quasar/app-vite/wrappers'
import viteCompression from 'vite-plugin-compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(() => ({
  supportTS: false,
  boot: ['dark-mode', 'plyr', 'install-store', 'resize-observer-patch', 'passive-events', 'axios'],
  css: [],
  extras: ['material-icons'],

  build: {
    vueRouterMode: 'history',
    publicPath: '/',
    env: {
      API: process.env.NODE_ENV === 'production' ? 'https://films.fotrino.com/api' : '/api'
    },
    // Only generate sourcemaps in non-production to reduce payload/processing
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
      viteConf.optimizeDeps.include = [
        ...(viteConf.optimizeDeps.include || []),
        'vue',
        'vue-router',
        'vuex',
        'quasar',
        'axios',
        'hls.js',
        'plyr',
        'dompurify',
        'dayjs',
        'i18n-iso-countries',
        'commentbox.io'
      ]

      // Optimize build for production
      viteConf.build = viteConf.build || {}
      viteConf.build.rollupOptions = viteConf.build.rollupOptions || {}
      viteConf.build.chunkSizeWarningLimit = 600 // Warn for chunks > 600kb

      // Single vendor chunk for better HTTP/2 performance
      const currentOutput = viteConf.build.rollupOptions.output || {}
      viteConf.build.rollupOptions.output = {
        ...currentOutput,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }

      // Generate pre-compressed assets (Brotli + Gzip) for better transfer sizes
      viteConf.plugins = viteConf.plugins || []
      viteConf.plugins.push(viteCompression({ algorithm: 'brotliCompress', ext: '.br' }))
      viteConf.plugins.push(viteCompression({ algorithm: 'gzip', ext: '.gz' }))
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
