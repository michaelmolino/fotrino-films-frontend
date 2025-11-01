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
  boot: ['install-store', 'resize-observer-patch', 'passive-events', 'axios'],
  css: ['app.sass'],
  extras: ['fontawesome-v6', 'material-icons'],

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
        'hls.js'
      ]

      // Optimize asset handling
      viteConf.build = viteConf.build || {}
      viteConf.build.assetsInlineLimit = 4096 // Inline assets < 4kb
      viteConf.build.cssCodeSplit = true // Split CSS per route
      viteConf.build.minify = 'terser' // Use terser for better compression
      viteConf.build.terserOptions = {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : []
        }
      }

      // Reduce number of chunks in production by grouping vendor code
      viteConf.build.rollupOptions = viteConf.build.rollupOptions || {}
      viteConf.build.chunkSizeWarningLimit = 500 // Warn for chunks > 500kb
      const currentOutput = viteConf.build.rollupOptions.output || {}
      viteConf.build.rollupOptions.output = {
        ...currentOutput,
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split vendor code into smaller chunks for better caching
            if (id.includes('quasar')) return 'quasar'
            if (id.includes('vue') || id.includes('vuex') || id.includes('vue-router'))
              return 'vue-core'
            if (id.includes('hls.js')) return 'hls'
            if (id.includes('axios')) return 'axios'
            return 'vendor'
          }
        }
      }

      // Generate pre-compressed assets (Brotli + Gzip) for better transfer sizes
      viteConf.plugins = viteConf.plugins || []
      viteConf.plugins.push(
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
        viteCompression({ algorithm: 'gzip', ext: '.gz' })
      )
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
