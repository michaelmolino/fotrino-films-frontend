/*
 * Quasar Vite config
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@quasar/app-vite/wrappers'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import istanbul from 'vite-plugin-istanbul'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configureForwardedHeaders = proxy => {
  proxy.on('proxyReq', (proxyReq, req) => {
    proxyReq.setHeader(
      'X-Forwarded-Host',
      req.headers.host || req.headers['x-forwarded-host'] || req.headers[':authority'] || ''
    )
    proxyReq.setHeader(
      'X-Forwarded-Proto',
      req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')
    )
  })
}

const apiProxyPrefixes = [
  '^/account/(auth|login)/[^/]+$',
  '/account/logout',
  '/account/mock-login',
  '/account/profile',
  '/account/providers',
  '/account/contracts/read-models',
  '^/admin/(contracts/read-models|jobs(?:/.*)?|media(?:/.*)?|users(?:/.*)?)$',
  '/channels',
  '/contracts',
  '/health',
  '/test/workers',
  '/uploads',
  '/uppy'
]

export default defineConfig(() => ({
  supportTS: false,
  boot: ['install-colada', 'install-axios'],
  css: [],
  extras: ['material-icons'],

  build: {
    vueRouterMode: 'history',
    publicPath: '/',
    env: {
      API:
        process.env.NODE_ENV === 'production'
          ? 'https://api.fotrino.com'
          : 'https://fotrino.example.com:8080',
      SAMPLE_CHANNEL_ID: process.env.SAMPLE_CHANNEL_ID || '',
      SAMPLE_CHANNEL_SLUG: process.env.SAMPLE_CHANNEL_SLUG || 'Sample-Channel'
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
        '@clients': path.resolve(__dirname, 'src/clients'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@css': path.resolve(__dirname, 'src/css'),
        '@deps': path.resolve(__dirname, 'node_modules')
      }
      viteConf.optimizeDeps = viteConf.optimizeDeps || {}
      viteConf.plugins = viteConf.plugins || []
      viteConf.plugins.push(
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
        viteCompression({ algorithm: 'gzip', ext: '.gz' })
      )
      if (process.env.ANALYZE === 'true') {
        viteConf.plugins.push(
          visualizer({
            filename: path.resolve(__dirname, 'dist/spa/stats.html'),
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: false
          })
        )
      }
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
    proxy: Object.fromEntries(
      apiProxyPrefixes.map(prefix => [
        prefix,
        {
          target: 'https://fotrino.example.com:65443/',
          changeOrigin: true,
          secure: false,
          configure: configureForwardedHeaders
        }
      ])
    )
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
